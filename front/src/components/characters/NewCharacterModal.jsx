import React, { useState, useContext } from 'react';
import { Modal, Button, Form, Alert, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

/**
 * NewCharacterModal
 * props:
 *  - show, onHide
 */
export default function NewCharacterModal({ show, onHide }) {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext) || { token: null }; // adapt si AuthContext different
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [templateType, setTemplateType] = useState('blank');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const templates = [
    { key: 'blank', label: 'Page vierge', thumb: null },
    { key: 'template1', label: 'Modèle A', thumb: '/templates/t1.png' },
    { key: 'template2', label: 'Modèle B', thumb: '/templates/t2.png' },
    { key: 'template3', label: 'Modèle C', thumb: '/templates/t3.png' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Le titre est requis.');
      return;
    }
    setLoading(true);
    try {
      const body = { title: title.trim(), description: description || null, templateType };
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch('/api/characters', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const text = await resp.text();
      let json;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (resp.status === 201) {
        const id = json?.id;
        // close modal and redirect to edit page with created flag
        onHide?.();
        navigate(`/dashboard/characters/${id}?created=1`);
      } else if (resp.status === 422) {
        const msg = json?.message || 'Erreurs de validation';
        setError(
          Array.isArray(json?.violations) ? json.violations.map((v) => v.message).join(', ') : msg,
        );
      } else if (resp.status === 401) {
        setError('Non authentifié. Veuillez vous connecter.');
      } else {
        setError(json?.error || json?.message || text || `Erreur serveur (${resp.status})`);
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Nouveau personnage</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3" controlId="charTitle">
            <Form.Label>Titre de la fiche *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Titre (ex : Chevalier Développeur)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="charDesc">
            <Form.Label>Description (courte)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Une phrase ou deux"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          <Form.Label>Type de fiche</Form.Label>
          <Row>
            {templates.map((t) => (
              <Col xs={6} md={3} key={t.key} className="mb-2">
                <Card
                  onClick={() => setTemplateType(t.key)}
                  style={{
                    cursor: 'pointer',
                    border: templateType === t.key ? '2px solid #0d6efd' : undefined,
                  }}
                >
                  <Card.Body className="p-2 text-center">
                    <div style={{ minHeight: 48 }}>
                      {t.thumb ? (
                        <img src={t.thumb} alt={t.label} style={{ maxWidth: '100%' }} />
                      ) : (
                        <strong>{t.label}</strong>
                      )}
                    </div>
                    <Form.Check
                      type="radio"
                      label=""
                      name="templateType"
                      id={`template-${t.key}`}
                      checked={templateType === t.key}
                      onChange={() => setTemplateType(t.key)}
                      className="mt-2"
                    />
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Enregistrer'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
