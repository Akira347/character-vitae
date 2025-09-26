// src/components/characters/NewCharacterModal.jsx
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Modal, Button, Form, Row, Col, Image, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

// import JSON templates
import TEMPLATES from '../../data/templates.json';

export default function NewCharacterModal({ show, onHide }) {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext) || {};

  const templateList = useMemo(() => {
    return Array.isArray(TEMPLATES) ? TEMPLATES : Object.values(TEMPLATES ?? {});
  }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [templateKey, setTemplateKey] = useState(
    templateList.length ? templateList[0].key : 'blank',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    if (show) {
      setTitle('');
      setDescription('');
      setTemplateKey(templateList.length ? templateList[0].key : 'blank');
      setError(null);
      setSubmitting(false);
      setPreviewModalOpen(false);
    }
  }, [show]);

  const handleSubmit = async (ev) => {
    if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }

    setSubmitting(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const body = {
        title: title.trim(),
        description: description ? description.trim() : null,
        templateType: templateKey,
      };

      const res = await fetch('/api/characters', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (res.ok || res.status === 201) {
        onHide?.();

        const id = json?.id ?? json?.data?.id ?? json?._id ?? null;
        if (id) {
          navigate(`/dashboard/characters/${id}?created=1`);
        } else {
          navigate('/dashboard');
        }
      } else {
        const msg = (json && (json.message || json.error)) || text || `Erreur ${res.status}`;
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
    } catch (err) {
      console.error('create character', err);
      setError('Erreur réseau ou serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTemplate = templateList.find((t) => t.key === templateKey) ?? null;

  return (
    <>
      <Modal show={show} onHide={() => onHide?.()} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Nouveau personnage</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger" data-testid="newchar-error">
                {error}
              </Alert>
            )}

            <Form.Group className="mb-3" controlId="charTitle">
              <Form.Label>Titre de la fiche (obligatoire)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ex : Guerrier de la data"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="Titre de la fiche"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="charDesc">
              <Form.Label>Description courte (facultative)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Une accroche courte..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="charTemplate">
              <Form.Label>Choix du modèle</Form.Label>
              <Row>
                {templateList.map((t) => (
                  <Col key={t.key} xs={12} sm={6} md={3} className="mb-2">
                    <div
                      role="button"
                      onClick={() => setTemplateKey(t.key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setTemplateKey(t.key);
                        }
                      }}
                      tabIndex={0}
                      className={`p-2 border rounded h-100 d-flex flex-column justify-content-between ${
                        t.key === templateKey ? 'border-3 border-primary' : ''
                      }`}
                      style={{
                        cursor: 'pointer',
                        background: t.key === templateKey ? 'rgba(0,0,0,0.03)' : '',
                      }}
                      aria-pressed={t.key === templateKey}
                      aria-label={`Choisir modèle ${t.label}`}
                    >
                      <div>
                        <strong>{t.label}</strong>
                      </div>
                      <div className="mt-2 text-center">
                        {t.thumb ? (
                          <Image
                            src={t.thumb}
                            alt={t.label}
                            fluid
                            style={{ maxHeight: 120, objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              height: 120,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#666',
                            }}
                          >
                            Vierge
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Form.Group>

            <div className="mt-3">
              <Form.Label>Aperçu</Form.Label>
              <div
                style={{
                  background: '#fff',
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                {selectedTemplate?.thumb ? (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 1280,
                      maxHeight: 720,
                      margin: '0 auto',
                      textAlign: 'center',
                    }}
                  >
                    <img
                      src={selectedTemplate.thumb}
                      alt={`Aperçu ${selectedTemplate.label}`}
                      style={{ width: '100%', height: 'auto', maxHeight: 720, objectFit: 'cover' }}
                    />
                    <div className="d-flex justify-content-center mt-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setPreviewModalOpen(true)}
                      >
                        Voir l'aperçu grand
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
                    Aperçu d'une page vierge
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => onHide?.()} disabled={submitting}>
              Annuler
            </Button>
            <Button
              data-testid="submit-newchar"
              variant="primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" />
                  &nbsp;Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={previewModalOpen} onHide={() => setPreviewModalOpen(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Aperçu — {selectedTemplate?.label ?? ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: 'center' }}>
          {selectedTemplate?.thumb ? (
            <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto' }}>
              <img
                src={selectedTemplate.thumb}
                alt={`Aperçu grand ${selectedTemplate?.label}`}
                style={{ width: '100%', height: 'auto', maxHeight: 720, objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div style={{ padding: 80 }}>Aperçu d'une page vierge</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setPreviewModalOpen(false)}>
            Fermer
          </Button>
          <Button variant="primary" onClick={() => setPreviewModalOpen(false)}>
            Valider ce modèle
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
