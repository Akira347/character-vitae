// front/src/pages/CharacterEdit.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Alert, Spinner, Container } from 'react-bootstrap';
import Dashboard from './Dashboard';
import { fetchJson } from '../utils/api';
import { AuthContext } from '../contexts/AuthContext';

/**
 * CharacterEdit - page d'édition d'une fiche personnage
 * URL attendue : /dashboard/characters/:id
 */
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
                // try fallback to /api/characters/:id (handled inside fetchJson)
                setError(err.message || 'Erreur récupération fiche');
                setCharacter(null);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [id, token]);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">Erreur : {typeof error === 'string' ? error : JSON.stringify(error)}</Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            {created && <Alert variant="success">Fiche créée avec succès</Alert>}

            {/* TODO: intégrer l'éditeur réel.
                Option A (préconisée) : réutiliser Dashboard en mode "edit" en passant props :
                    <Dashboard characterId={id} initialCharacter={character} />
                Option B : intégrer ici les composants d'édition (AvatarEditor, SectionContainer, ...).
            */}
            <div>
                {/* pour l'instant on réutilise Dashboard : il faudra adapter Dashboard pour accepter characterId */}
                <Dashboard characterId={id} initialCharacter={character} />
            </div>
        </Container>
    );
}
