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
          // token invalide / expiré -> cleanup
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

      if (resp.ok && json && json.token) {
        localStorage.setItem(TOKEN_KEY, json.token);
        setToken(json.token);
        await fetchMe(json.token);
        return { ok: true };
      }

      return { ok: false, status: resp.status, body: json || text };
    } catch (err) {
      return { ok: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}
