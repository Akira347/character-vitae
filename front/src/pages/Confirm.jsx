import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Confirm() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Confirmation en cours...');
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setMessage('Token manquant');
      return;
    }

    fetch(`/api/confirm?token=${token}`)
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setMessage(data.message || 'Compte confirmé !');
          // Rediriger vers login modal
          navigate('/?confirmed=1', { replace: true });
        } else {
          setMessage(data.error || 'Erreur de confirmation');
        }
      })
      .catch(() => setMessage('Erreur serveur'));
  }, [searchParams, navigate]);

  return <div style={{ padding: '2rem' }}>{message}</div>;
}
