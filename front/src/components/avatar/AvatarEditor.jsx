// src/components/section/AvatarEditor.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Row, Col, Image } from 'react-bootstrap';
import CroMagnonAvatar from '../../assets/avatars/cro-magnon-v1.webp';

/**
 * Modal pour personnaliser l'avatar (choix sexe, afficher avatar ou photo, upload...).
 *
 * @typedef AvatarData
 * @property {'Homme'|'Femme'} [sexe]                   Sexe affiché par défaut
 * @property {'avatar'|'photo'|'auto'} [affichage]      Mode d'affichage par défaut
 * @property {string} [photoUrl]                        URL de la photo personnelle (si fournie)
 * @property {File|null} [uploadedFile]                 Fichier image sélectionné par l'utilisateur
 *
 * @param {object} props                                Props du composant (destructurées ci-dessous)
 * @param {boolean} props.show                          Si true, affiche la modale
 * @param {AvatarData} [props.data]                     Données initiales de l'avatar (optionnel, voir Properties)
 * @param {Function} props.onSave  Callback appelé lors de la sauvegarde avec les nouvelles données
 * @param {Function} props.onCancel                   Callback appelé pour annuler/fermer la modale
 * @returns {JSX.ELement}                               Élement React représentant la modale AvatarEditor
 */
export default function AvatarEditor({ show, data, onSave, onCancel }) {
  // état local
  const [formData, setFormData] = useState({
    sexe: 'Homme',
    affichage: 'avatar', // 'photo' | 'avatar' | 'auto'
    photoUrl: '',
    uploadedFile: null,
    ...data,
  });

  // sync quand data change
  useEffect(() => {
    setFormData({
      sexe: data.sexe ?? 'Homme',
      affichage: data.affichage ?? 'avatar',
      photoUrl: data.photoUrl ?? '',
      uploadedFile: null,
    });
  }, [data]);

  // gestion du drop de fichier
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFormData((fd) => ({ ...fd, uploadedFile: file }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((fd) => ({ ...fd, uploadedFile: file }));
    }
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Modal show={show} onHide={onCancel} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Personnalisation de l&apos;avatar</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Sexe du personnage</Form.Label>
            <Form.Select
              value={formData.sexe}
              onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
            >
              <option>Homme</option>
              <option>Femme</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Affichage par défaut</Form.Label>
            <div>
              <Form.Check
                inline
                type="radio"
                label="Avatar fictif"
                name="affichage"
                checked={formData.affichage === 'avatar'}
                onChange={() => setFormData({ ...formData, affichage: 'avatar' })}
              />
              <Form.Check
                inline
                type="radio"
                label="Photo personnelle"
                name="affichage"
                checked={formData.affichage === 'photo'}
                onChange={() => setFormData({ ...formData, affichage: 'photo' })}
              />
              <Form.Check
                inline
                type="radio"
                label="Laisser le choix au visiteur"
                name="affichage"
                checked={formData.affichage === 'auto'}
                onChange={() => setFormData({ ...formData, affichage: 'auto' })}
              />
            </div>
          </Form.Group>

          {(formData.affichage === 'photo' || formData.affichage === 'auto') && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>URL de la photo personnelle</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://..."
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                />
              </Form.Group>

              <div className="text-center my-2">— ou —</div>

              <Form.Group className="mb-4">
                <Form.Label>Fichier local</Form.Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('fileInput').click()}
                  style={{
                    border: '2px dashed #ccc',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#f8f9fa',
                  }}
                >
                  {formData.uploadedFile ? (
                    <span>{formData.uploadedFile.name}</span>
                  ) : (
                    <span>Glissez un fichier ici ou cliquez pour parcourir</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    id="fileInput"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                </div>
              </Form.Group>
            </>
          )}

          {/* Aperçus */}
          <Row className="text-center gy-3">
            {(formData.affichage === 'avatar' || formData.affichage === 'auto') && (
              <Col>
                <p>Avatar fictif</p>
                <Image src={CroMagnonAvatar} rounded fluid style={{ maxHeight: 150 }} />
              </Col>
            )}
            {(formData.affichage === 'photo' || formData.affichage === 'auto') && (
              <Col>
                <p>Photo personnelle</p>
                {formData.uploadedFile || formData.photoUrl ? (
                  <Image
                    src={
                      formData.uploadedFile
                        ? URL.createObjectURL(formData.uploadedFile)
                        : formData.photoUrl
                    }
                    rounded
                    fluid
                    style={{ maxHeight: 150 }}
                  />
                ) : (
                  <div className="text-muted">Aucune photo disponible</div>
                )}
              </Col>
            )}
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Enregistrer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

AvatarEditor.propTypes = {
  show: PropTypes.bool.isRequired,
  data: PropTypes.shape({
    sexe: PropTypes.oneOf(['Homme', 'Femme']),
    affichage: PropTypes.oneOf(['avatar', 'photo', 'auto']),
    photoUrl: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

AvatarEditor.defaultProps = {
  data: {},
};
