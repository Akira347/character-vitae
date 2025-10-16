// src/contexts/AuthContext.jsx
import React, { createContext, useEffect, useState, useCallback } from 'react';

export const AuthContext = createContext(null);
const TOKEN_KEY = 'cv_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

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
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          return;
        }
        if (!resp.ok) {
          setUser(null);
          return;
        }
        setUser(await resp.json());
      } catch (e) {
        setUser(null);
      }
    },
    [token],
  );

  useEffect(() => {
    if (token) fetchMe(token);
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

      // If OK and token provided
      if (resp.ok && json && json.token) {
        localStorage.setItem(TOKEN_KEY, json.token);
        setToken(json.token);
        await fetchMe(json.token);
        return { ok: true };
      }

      // If server returns a JSON message indicating not confirmed, set flag
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
