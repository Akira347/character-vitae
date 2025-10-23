// src/components/characters/NewCharacterModal.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Image, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import TEMPLATES from '../../data/templates.json';

/**
 * NewCharacterModal
 *
 * Props:
 *  - show, onHide
 *  - mode: 'create' | 'edit'
 *  - initialData: existing character raw object (when mode==='edit')
 */
export default function NewCharacterModal({ show, onHide, mode = 'create', initialData = null }) {
  const { token } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const templateList = Array.isArray(TEMPLATES) ? TEMPLATES : Object.values(TEMPLATES ?? {});
  // Add special "Actuel" option at head when editing
  const effectiveTemplateList =
    mode === 'edit'
      ? [
          { key: '__current__', label: 'Actuel (conserver la disposition actuelle)', thumb: null },
          ...templateList,
        ]
      : templateList;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // ALWAYS default to '__current__' when editing (user requested)
  const [templateKey, setTemplateKey] = useState(
    mode === 'edit'
      ? '__current__'
      : effectiveTemplateList.length
        ? effectiveTemplateList[0].key
        : 'blank',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // confirmation dialog when changing template on edit
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingUpdateRef = useRef(null); // stores {url, method, headers, body} while waiting confirmation

  const prevShowRef = useRef(false);
  useEffect(() => {
    const was = prevShowRef.current;
    if (!was && show) {
      // opening modal; initialize fields from initialData if editing
      if (mode === 'edit' && initialData) {
        setTitle(initialData.title ?? '');
        setDescription(initialData.description ?? '');
        // ensure Actuel is preselected as requested
        setTemplateKey('__current__');
      } else {
        // create: fresh defaults
        setTitle('');
        setDescription('');
        setTemplateKey(effectiveTemplateList.length ? effectiveTemplateList[0].key : 'blank');
      }
      setError(null);
      setSubmitting(false);
      setPreviewModalOpen(false);
      setConfirmOpen(false);
      pendingUpdateRef.current = null;
    }
    prevShowRef.current = show;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, mode, initialData]);

  const getServerId = () => {
    if (!initialData) return null;
    if (initialData.id) return initialData.id;
    if (initialData['@id']) {
      const parts = String(initialData['@id']).split('/');
      return parts[parts.length - 1] || null;
    }
    return null;
  };

  const normalizeLayoutShape = (raw) => {
    if (!raw || typeof raw !== 'object') return { rows: [] };
    if (Array.isArray(raw.rows)) {
      return {
        rows: raw.rows.map((row) =>
          Array.isArray(row) ? row.map((cell) => ({ ...(cell || {}) })) : [],
        ),
      };
    }
    return { rows: [] };
  };

  const buildContentMapFromInitial = (initial) => {
    const map = {};
    if (!initial) return map;
    if (Array.isArray(initial.sections) && initial.sections.length > 0) {
      for (const s of initial.sections) {
        if (!s) continue;
        const t = typeof s.type === 'string' ? s.type : null;
        if (!t) continue;
        if (map[t] === undefined) {
          map[t] = s.content ?? (s.type === 'empty' ? null : []);
        }
      }
      return map;
    }
    if (initial.layout && Array.isArray(initial.layout.rows)) {
      for (const row of initial.layout.rows) {
        if (!Array.isArray(row)) continue;
        for (const cell of row) {
          if (!cell || typeof cell !== 'object') continue;
          const t = typeof cell.type === 'string' ? cell.type : null;
          if (!t) continue;
          if (map[t] === undefined) {
            map[t] = Object.prototype.hasOwnProperty.call(cell, 'content')
              ? cell.content
              : cell.type === 'empty'
                ? null
                : [];
          }
        }
      }
    }
    return map;
  };

  const mergeTemplateWithContentMap = (tplLayout, contentMap) => {
    const tpl = normalizeLayoutShape(tplLayout);
    const out = { rows: [] };
    for (const row of tpl.rows) {
      const newRow = [];
      for (const cell of row) {
        const safeCell = { ...(cell || {}) };
        const type = typeof safeCell.type === 'string' ? safeCell.type : 'empty';
        if (type === 'empty') {
          safeCell.content = Object.prototype.hasOwnProperty.call(safeCell, 'content')
            ? safeCell.content
            : null;
        } else {
          if (Object.prototype.hasOwnProperty.call(contentMap, type)) {
            safeCell.content = contentMap[type];
          } else {
            safeCell.content = Object.prototype.hasOwnProperty.call(safeCell, 'content')
              ? safeCell.content
              : [];
          }
        }
        safeCell.isCollapsed = Object.prototype.hasOwnProperty.call(safeCell, 'isCollapsed')
          ? !!safeCell.isCollapsed
          : false;
        newRow.push(safeCell);
      }
      out.rows.push(newRow);
    }
    return out;
  };

  const doSubmitRequest = async ({ url, method, headers, body }) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (res.status === 201 || (res.ok && (method === 'PATCH' || method === 'PUT'))) {
        onHide?.();

        const createdId =
          json?.id ??
          json?._id ??
          (json?.['@id'] ? String(json['@id']).split('/').pop() : getServerId());

        if (method === 'POST') {
          window.dispatchEvent(
            new CustomEvent('character-created', { detail: { id: String(createdId) } }),
          );
        } else {
          // PATCH/PUT
          window.dispatchEvent(
            new CustomEvent('character-updated', { detail: { id: String(createdId) } }),
          );
          // also a specific layout change event to make Dashboard reload layout immediately
          window.dispatchEvent(
            new CustomEvent('character-layout-changed', { detail: { id: String(createdId) } }),
          );
        }

        if (createdId) {
          navigate(`/dashboard/characters/${createdId}${method === 'POST' ? '?created=1' : ''}`);
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
      console.error('create/edit character', err);
      setError('Erreur réseau ou serveur.');
    } finally {
      setSubmitting(false);
      pendingUpdateRef.current = null;
    }
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
      setError('Vous devez être connecté pour créer/éditer une fiche.');
      return;
    }

    try {
      if (mode === 'create') {
        const headers = {
          'Content-Type': 'application/ld+json',
          Accept: 'application/ld+json',
          Authorization: `Bearer ${token}`,
        };

        const body = {
          title: title.trim(),
          description: description ? description.trim() : null,
          templateType: templateKey,
        };

        await doSubmitRequest({ url: '/api/characters', method: 'POST', headers, body });
        return;
      }

      // EDIT
      const sid = getServerId();
      if (!sid) {
        setError('Impossible de déterminer l’identifiant du personnage.');
        return;
      }

      const isKeepLayout = templateKey === '__current__';
      if (!isKeepLayout) {
        const selectedTemplate = templateList.find((t) => t.key === templateKey);
        const tplLayout = selectedTemplate
          ? (selectedTemplate.layout ?? { rows: [] })
          : { rows: [] };

        const contentMap = buildContentMapFromInitial(initialData ?? {});
        const mergedLayout = mergeTemplateWithContentMap(tplLayout, contentMap);

        const headers = {
          'Content-Type': 'application/merge-patch+json',
          Accept: 'application/ld+json',
          Authorization: `Bearer ${token}`,
        };

        const body = {
          title: title.trim(),
          description: description ? description.trim() : null,
          templateType: templateKey,
          layout: mergedLayout,
        };

        pendingUpdateRef.current = {
          url: `/apip/characters/${sid}`,
          method: 'PATCH',
          headers,
          body,
        };
        setConfirmOpen(true);
        return;
      }

      // keep layout -> simple patch title/desc
      {
        const headers = {
          'Content-Type': 'application/merge-patch+json',
          Accept: 'application/ld+json',
          Authorization: `Bearer ${token}`,
        };
        const body = {
          title: title.trim(),
          description: description ? description.trim() : null,
        };

        await doSubmitRequest({ url: `/apip/characters/${sid}`, method: 'PATCH', headers, body });
        return;
      }
    } catch (err) {
      console.error('handleSubmit error', err);
      setError('Erreur interne.');
    }
  };

  const handleConfirmApplyTemplate = async (confirm) => {
    setConfirmOpen(false);
    if (!confirm) {
      pendingUpdateRef.current = null;
      return;
    }
    const pending = pendingUpdateRef.current;
    if (!pending) {
      setError('Aucune modification en attente.');
      return;
    }
    await doSubmitRequest(pending);
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
                {effectiveTemplateList.map((t) => (
                  <Col key={t.key} xs={12} sm={6} md={3} className="mb-2">
                    <div
                      role="button"
                      onClick={() => setTemplateKey(t.key)}
                      onKeyDown={() => setTemplateKey(t.key)}
                      tabIndex={0}
                      className={`p-2 border rounded h-100 d-flex flex-column justify-content-between ${
                        t.key === templateKey ? 'border-3 border-primary' : ''
                      }`}
                      style={{
                        cursor: 'pointer',
                        background: t.key === templateKey ? 'rgba(0,0,0,0.03)' : '',
                      }}
                    >
                      <div>
                        <strong>{t.label}</strong>
                        {t.key === '__current__' && (
                          <div style={{ fontSize: 12 }}>Garde la disposition actuelle</div>
                        )}
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
                            Aperçu
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
                {effectiveTemplateList.find((x) => x.key === templateKey)?.thumb ? (
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
                      src={effectiveTemplateList.find((x) => x.key === templateKey).thumb}
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
                    Aperçu du modèle sélectionné
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

      {/* preview modal */}
      <Modal show={previewModalOpen} onHide={() => setPreviewModalOpen(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Aperçu — {effectiveTemplateList.find((x) => x.key === templateKey)?.label ?? ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: 'center' }}>
          {effectiveTemplateList.find((x) => x.key === templateKey)?.thumb ? (
            <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto' }}>
              <img
                src={effectiveTemplateList.find((x) => x.key === templateKey).thumb}
                alt="Aperçu"
                style={{ width: '100%', height: 'auto', maxHeight: 720, objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div style={{ padding: 80 }}>Aperçu du modèle</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setPreviewModalOpen(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* confirmation modal when applying a new template on edit */}
      <Modal show={confirmOpen} onHide={() => setConfirmOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer le remplacement de la disposition</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Vous avez choisi un nouveau modèle.{' '}
            <strong>
              Si vous continuez, la disposition (layout) actuelle sera remplacée et ne pourra pas
              être récupérée automatiquement.
            </strong>
          </p>
          <p>
            Les contenus de sections existants seront conservés quand ils correspondent à des
            sections du nouveau modèle (par type). Certains emplacements pourront cependant être
            vides.
          </p>
          <p>Souhaitez-vous continuer ?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => handleConfirmApplyTemplate(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={() => handleConfirmApplyTemplate(true)}>
            Oui, remplacer la disposition
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
