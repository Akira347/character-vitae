// front/src/components/characters/NewCharacterModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Modal, Button, Form, Row, Col, Image, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { TEMPLATES } from '../../data/templates';
import { fetchJson } from '../../utils/api';

export default function NewCharacterModal({ show, onHide }) {
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const templates = Object.values(TEMPLATES);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [templateKey, setTemplateKey] = useState('blank');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (show) {
            setTitle('');
            setDescription('');
            setTemplateKey('blank');
            setError(null);
            setSubmitting(false);
        }
    }, [show]);

    const handleSubmit = async (ev) => {
        ev.preventDefault();
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
                // not sending full layout: backend will populate from templateType if layout missing
            };

            const res = await fetchJson('/api/characters', {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            // res should be parsed JSON
            const id = res?.id ?? null;
            onHide?.();

            if (id) {
                navigate(`/dashboard/characters/${id}?created=1`);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('create character', err);
            // prefer user-friendly message; avoid showing raw backend trace
            setError(err.message || 'Erreur lors de la création.');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedTemplate = TEMPLATES[templateKey] ?? TEMPLATES.blank;

    return (
        <Modal show={show} onHide={() => onHide?.()} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Nouveau personnage</Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form.Group className="mb-3" controlId="charTitle">
                        <Form.Label>Titre de la fiche (obligatoire)</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ex : Guerrier de la data"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
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
                            {templates.map((t) => (
                                <Col key={t.key} xs={12} sm={6} md={3} className="mb-2">
                                    <div
                                        role="button"
                                        onClick={() => setTemplateKey(t.key)}
                                        onKeyDown={() => setTemplateKey(t.key)}
                                        tabIndex={0}
                                        className={`p-2 border rounded h-100 d-flex flex-column justify-content-between ${t.key === templateKey ? 'border-3 border-primary' : ''
                                            }`}
                                        style={{ cursor: 'pointer', background: t.key === templateKey ? 'rgba(0,0,0,0.03)' : '' }}
                                    >
                                        <div>
                                            <strong>{t.label}</strong>
                                        </div>
                                        <div className="mt-2 text-center">
                                            {t.thumb ? (
                                                <Image src={t.thumb} alt={t.label} fluid style={{ maxHeight: 120, objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
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
                        <div style={{ background: '#fff', padding: 8, borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)' }}>
                            {selectedTemplate?.thumb ? (
                                <div style={{ width: '100%', maxWidth: 1280, maxHeight: 720, margin: '0 auto', textAlign: 'center' }}>
                                    <img
                                        src={selectedTemplate.thumb}
                                        alt={`Aperçu ${selectedTemplate.label}`}
                                        style={{ width: '100%', height: 'auto', maxHeight: 720, objectFit: 'cover' }}
                                    />
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
                    <Button variant="primary" type="submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <Spinner animation="border" size="sm" />&nbsp;Enregistrement...
                            </>
                        ) : (
                            'Enregistrer'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
