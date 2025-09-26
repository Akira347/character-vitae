// front/src/pages/CharacterEdit.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Alert, Spinner, Container } from 'react-bootstrap';
import Dashboard from './Dashboard';
import { fetchJson } from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';

export default function CharacterEdit() {
  const { id } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const created = params.get('created') === '1';
  const { token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const json = await fetchJson(`/apip/characters/${id}`, { method: 'GET', headers });
        if (mounted) setCharacter(json);
      } catch (err) {
        setError(err.message || 'Erreur récupération fiche');
        setCharacter(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id, token]);

  if (loading) {
    return (
      <Container fluid className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-5">
        <Alert variant="danger">
          Erreur : {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      </Container>
    );
  }

  return (
    // utiliser Container fluid pour éviter marges latérales ajoutées par container non-fluid
    <Container fluid className="py-4 px-0">
      {created && <Alert variant="success">Fiche créée avec succès</Alert>}

      <div>
        <Dashboard characterId={id} initialCharacter={character} />
      </div>
    </Container>
  );
}