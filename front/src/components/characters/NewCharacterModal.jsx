// src/components/characters/NewCharacterModal.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Image, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import TEMPLATES from '../../data/templates.json';

export default function NewCharacterModal({ show, onHide, mode = 'create', initialData = null }) {
  const { token } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const templateList = Array.isArray(TEMPLATES) ? TEMPLATES : Object.values(TEMPLATES ?? {});
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [templateKey, setTemplateKey] = useState(
    templateList.length ? templateList[0].key : 'blank',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const prevShowRef = useRef(false);
  useEffect(() => {
    const was = prevShowRef.current;
    if (!was && show) {
      if (mode === 'edit' && initialData) {
        setTitle(initialData.title ?? '');
        setDescription(initialData.description ?? '');
        setTemplateKey(
          initialData.templateType ?? (templateList.length ? templateList[0].key : 'blank'),
        );
      } else {
        setTitle('');
        setDescription('');
        setTemplateKey(templateList.length ? templateList[0].key : 'blank');
      }
      setError(null);
      setSubmitting(false);
      setPreviewModalOpen(false);
    }
    prevShowRef.current = show;
  }, [show, mode, initialData, templateList]);

  const getServerId = () => {
    if (!initialData) return null;
    if (initialData.id) return initialData.id;
    if (initialData['@id']) {
      const parts = String(initialData['@id']).split('/');
      return parts[parts.length - 1] || null;
    }
    return null;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (submitting) return;
    setError(null);

    if (!title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }

    if (!token) {
      setError('Vous devez être connecté pour créer une fiche.');
      return;
    }

    setSubmitting(true);
    try {
      const headers = {
        'Content-Type': 'application/ld+json',
        Authorization: `Bearer ${token}`,
      };

      const body = {
        title: title.trim(),
        description: description ? description.trim() : null,
        templateType: templateKey,
      };

      // IMPORTANT: appeler le controller personnalisé qui setOwner -> /apip/characters
      const url =
        mode === 'edit' && getServerId() ? `/apip/characters/${getServerId()}` : '/apip/characters';
      const method = mode === 'edit' && getServerId() ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
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

      if (res.status === 201 || (res.ok && method === 'PUT')) {
        onHide?.();

        const createdId =
          json?.id ?? json?._id ?? (json?.['@id'] ? json['@id'].split('/').pop() : getServerId());

        // notify other components (Header listens)
        window.dispatchEvent(new CustomEvent('character-created', { detail: { id: createdId } }));

        if (createdId) {
          navigate(`/dashboard/characters/${createdId}?created=1`);
        } else {
          navigate('/dashboard');
        }
      } else if (res.status === 401) {
        setError('Authentification requise. Veuillez vous reconnecter.');
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

  const handleDelete = async () => {
    const sid = getServerId();
    if (!sid) {
      setError('Impossible de déterminer l’identifiant du personnage.');
      return;
    }
    if (!window.confirm('Confirmer la suppression de cette fiche ? Cette action est irréversible.'))
      return;

    setSubmitting(true);
    try {
      const res = await fetch(`/apip/characters/${sid}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        onHide?.();
        window.dispatchEvent(new CustomEvent('character-deleted', {}));
        navigate('/');
      } else {
        const text = await res.text();
        throw new Error(text || `Erreur ${res.status}`);
      }
    } catch (err) {
      console.error('delete character', err);
      setError('Impossible de supprimer la fiche.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal show={show} onHide={() => onHide?.()} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {mode === 'edit' ? 'Édition du personnage' : 'Nouveau personnage'}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert data-testid="modal-error" variant="danger">
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
                      onKeyDown={() => setTemplateKey(t.key)}
                      tabIndex={0}
                      className={`p-2 border rounded h-100 d-flex flex-column justify-content-between ${t.key === templateKey ? 'border-3 border-primary' : ''}`}
                      style={{
                        cursor: 'pointer',
                        background: t.key === templateKey ? 'rgba(0,0,0,0.03)' : '',
                      }}
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
                {templateList.find((x) => x.key === templateKey)?.thumb ? (
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
                      src={templateList.find((x) => x.key === templateKey).thumb}
                      alt={`Aperçu`}
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
            {mode === 'edit' && (
              <Button variant="danger" onClick={handleDelete} disabled={submitting}>
                {submitting ? 'Suppression...' : 'Supprimer'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => onHide?.()} disabled={submitting}>
              Annuler
            </Button>
            <Button
              data-testid="modal-submit"
              variant="primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" /> &nbsp;Enregistrement...
                </>
              ) : mode === 'edit' ? (
                'Enregistrer les modifications'
              ) : (
                'Enregistrer'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={previewModalOpen} onHide={() => setPreviewModalOpen(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Aperçu — {templateList.find((x) => x.key === templateKey)?.label ?? ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: 'center' }}>
          {templateList.find((x) => x.key === templateKey)?.thumb ? (
            <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto' }}>
              <img
                src={templateList.find((x) => x.key === templateKey).thumb}
                alt="Aperçu"
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
          <Button
            variant="primary"
            onClick={() => {
              setTemplateKey(templateKey);
              setPreviewModalOpen(false);
            }}
          >
            Valider ce modèle
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
