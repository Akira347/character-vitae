// src/components/section/SectionForm.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form } from 'react-bootstrap';

/**
 * Remplace les espaces et tirets d'une chaîne pour la normaliser.
 *
 * @param {string} s — Chaîne d’entrée
 * @returns {string} Chaîne normalisée sans espace ni tiret
 */
const normalize = (s) => s.replace(/\s|-/g, '').toLowerCase();

/**
 * Formulaire modale pour éditer une section (mono-entrée ou multi-entrée).
 *
 * @param {object} props                      Les props du composant
 * @param {boolean} props.show                Affiche la modale si true
 * @param {string} props.type                 Type de section à éditer
 * @param {object|Array} [props.initialData]  Données initiales du formulaire
 * @param {Function} props.onSave             Callback avec formData à l’enregistrement
 * @param {Function} props.onCancel           Callback pour fermer sans sauvegarder
 * @returns {JSX.Element}                     Élement React représentant la modale SectionForm
 */
export default function SectionForm({ show, type, initialData, onSave, onCancel }) {
  // Types à traiter en « multi »
  const MULTI = ['qualités', 'langues', 'hobbies', 'hautsfaits', 'talents'].map(normalize);

  // Détection robuste
  const isMulti = MULTI.includes(normalize(type || ''));

  // On met à jour localement quand type ou initialData changent
  const [formData, setFormData] = useState(isMulti ? [] : {});

  useEffect(() => {
    if (isMulti) {
      setFormData(Array.isArray(initialData) ? initialData : []);
    } else {
      setFormData(typeof initialData === 'object' && initialData !== null ? initialData : {});
    }
  }, [show, type, initialData]);

  const fieldsByType = {
    Identité: [
      { name: 'nom', label: 'Nom', required: true },
      { name: 'prénom', label: 'Prénom', required: true },
      { name: 'nickname', label: 'Pseudo' },
      { name: 'job', label: 'Poste ou Poste recherché', required: true },
      { name: 'speciality', label: 'Spécialité' },
      { name: 'level', label: 'Niveau' },
    ],
    Lore: [{ name: 'lore', label: 'Lore', as: 'textarea', required: true, minLength: 20 }],
    NewbiePark: [
      { name: 'start', label: 'Date de début', type: 'date' },
      { name: 'end', label: 'Date de fin', type: 'date', required: true },
      { name: 'title', label: 'Titre', required: true },
      { name: 'location', label: 'Établissement' },
    ],
    Quêtes: [
      { name: 'start', label: 'Date de début', type: 'date', required: true },
      { name: 'end', label: 'Date de fin', type: 'date' },
      { name: 'title', label: 'Titre', required: true },
      { name: 'quest', label: 'Quête', as: 'textarea', required: true },
    ],
    HautsFaits: [{ name: 'achievement', label: 'Haut-fait', required: true }],
    Talents: [
      { name: 'title', label: 'Titre', required: true },
      { name: 'level', label: 'Niveau', required: true },
    ],
    Contact: [
      { name: 'phone', label: 'Téléphone', required: true },
      { name: 'email', label: 'E-mail', required: true },
      { name: 'address', label: 'Adresse', required: true },
      { name: 'social_media', label: 'Réseau social' },
    ],
    Qualités: [{ name: 'quality', label: 'Qualité', required: true }],
    Langues: [
      { name: 'lang', label: 'Langues', required: true },
      { name: 'level', label: 'Niveau', required: true },
    ],
    Hobbies: [{ name: 'hobby', label: 'Hobby', required: true }],
  };
  const fields = fieldsByType[type] || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const handleSubmit = () => onSave(formData);

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Éditer la section « {type} »</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isMulti ? (
          // 🔒 On mappe seulement si formData est vraiment un array
          Array.isArray(formData) &&
          formData.map((item, idx) => (
            <Form key={idx} className="mb-3">
              {fields.map((f) => (
                <Form.Group key={f.name} className="mb-3">
                  <Form.Label>
                    {f.label}
                    {f.required && '*'}
                  </Form.Label>
                  <Form.Control
                    name={f.name}
                    type={f.type || 'text'}
                    as={f.as || 'input'}
                    value={item[f.name] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((fd) => {
                        const copy = [...fd];
                        copy[idx] = { ...copy[idx], [f.name]: val };
                        return copy;
                      });
                    }}
                    required={f.required}
                    minLength={f.minLength}
                  />
                </Form.Group>
              ))}
            </Form>
          ))
        ) : (
          <Form>
            {fields.map((f) => (
              <Form.Group key={f.name} className="mb-3">
                <Form.Label>
                  {f.label}
                  {f.required && '*'}
                </Form.Label>
                <Form.Control
                  name={f.name}
                  type={f.type || 'text'}
                  as={f.as || 'input'}
                  value={formData[f.name] || ''}
                  onChange={handleChange}
                  required={f.required}
                  minLength={f.minLength}
                />
              </Form.Group>
            ))}
          </Form>
        )}

        {isMulti && (
          <Button
            variant="link"
            onClick={() => setFormData((fd) => (Array.isArray(fd) ? [...fd, {}] : [{}]))}
          >
            + Ajouter un {type.slice(0, -1)}
          </Button>
        )}
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

SectionForm.propTypes = {
  show: PropTypes.bool.isRequired,
  type: PropTypes.string.isRequired,
  initialData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

SectionForm.defaultProps = {
  initialData: undefined,
};
