// src/components/RequireAuth.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function RequireAuth({ children }) {
  const { user } = useContext(AuthContext) || {};
  if (!user) {
    // redirect to home (or open login modal instead)
    return <Navigate to="/" replace />;
  }
  return children;
}
