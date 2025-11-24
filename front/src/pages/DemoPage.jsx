import React, { useEffect, useState } from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';
import Dashboard from './Dashboard';
import { fetchJson } from '../utils/api';

export default function DemoPage() {
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await fetchJson('/apip/character/demo', { method: 'GET' });
        if (mounted) setDemo(json);
      } catch (err) {
        setError(err?.message || 'Impossible de charger la démo');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error || !demo) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Impossible de charger la démo depuis le serveur — vérifie la configuration.
        </Alert>
      </Container>
    );
  }

  // render Dashboard in readOnly mode so it looks EXACTLY like the editor but disabled
  return (
    <Container fluid className="py-4">
      <h2>Démo (lecture seule)</h2>
      <Dashboard initialCharacter={demo} readOnly demoOnlyAvatar />
    </Container>
  );
}
