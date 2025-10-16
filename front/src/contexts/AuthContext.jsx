// src/contexts/AuthContext.jsx
import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';

export const AuthContext = createContext(null);
const TOKEN_KEY = 'cv_token';

function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const scheduleAutoLogout = (tok) => {
    clearLogoutTimer();
    if (!tok) return;
    const payload = parseJwt(tok);
    if (payload && payload.exp) {
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      const ms = expiresAt - now;
      // schedule a little earlier (10s before) to be safe
      const delay = Math.max(0, ms - 10000);
      if (delay <= 0) {
        // token already expired or about to expire -> immediate logout
        window.dispatchEvent(new CustomEvent('session-expired'));
        logout();
      } else {
        logoutTimerRef.current = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('session-expired'));
          logout();
        }, delay);
      }
    }
  };

  const fetchMe = useCallback(
    async (t) => {
      const current = t || token;
      if (!current) {
        setUser(null);
        return;
      }

      try {
        const resp = await fetch('/api/me', { headers: { Authorization: `Bearer ${current}` } });
        if (resp.status === 401) {
          // token invalide / expiré -> cleanup + signaler
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          window.dispatchEvent(new CustomEvent('session-expired'));
          return;
        }
        if (!resp.ok) {
          setUser(null);
          return;
        }
        const json = await resp.json();
        setUser(json);
      } catch (e) {
        setUser(null);
      }
    },
    [token],
  );

  useEffect(() => {
    if (token) {
      scheduleAutoLogout(token);
      fetchMe(token);
    } else {
      clearLogoutTimer();
      setUser(null);
    }
    // cleanup on unmount
    return () => clearLogoutTimer();
  }, [token, fetchMe]);

  const login = async ({ username, password }) => {
    setLoading(true);
    try {
      const resp = await fetch('/api/login_check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const text = await resp.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (resp.ok && json && json.token) {
        localStorage.setItem(TOKEN_KEY, json.token);
        setToken(json.token);
        // schedule auto logout based on token exp
        scheduleAutoLogout(json.token);
        await fetchMe(json.token);
        return { ok: true };
      }

      const unconfirmed =
        resp.status === 403 ||
        (json &&
          (json.message || json.error) &&
          /confirm/i.test(String(json.message || json.error)));

      return { ok: false, status: resp.status, body: json || text, unconfirmed };
    } catch (err) {
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async (email) => {
    try {
      const resp = await fetch('/api/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await resp.json().catch(() => null);
      return { ok: resp.ok, status: resp.status, body: json };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    clearLogoutTimer();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, logout, fetchMe, resendConfirmation }}
    >
      {children}
    </AuthContext.Provider>
  );
}
