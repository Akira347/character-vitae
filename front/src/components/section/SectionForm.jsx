// src/components/section/SectionForm.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

/* normalize helper as before */
const normalize = (s) => s.replace(/\s|-/g, '').toLowerCase();

export default function SectionForm({ show, type, initialData, onSave, onCancel }) {
  const MULTI = ['qualités', 'langues', 'hobbies', 'hautsfaits', 'talents'].map(normalize);
  const isMulti = MULTI.includes(normalize(type || ''));

  const [formData, setFormData] = useState(isMulti ? [] : {});
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
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
      { name: 'level', label: 'Niveau' }, // facultatif
    ],
    Lore: [{ name: 'lore', label: 'Lore', as: 'textarea', required: true, minLength: 20 }],
    NewbiePark: [
      { name: 'start', label: 'Date de début', type: 'date', required: true },
      { name: 'end', label: 'Date de fin', type: 'date' },
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

  const cleanObject = (obj) => {
    // remove keys with empty string/null/undefined
    const out = {};
    Object.keys(obj).forEach((k) => {
      const v = obj[k];
      if (v === null || v === undefined) return;
      if (typeof v === 'string' && v.trim() === '') return;
      out[k] = v;
    });
    return out;
  };

  const cleanData = (data) => {
    if (Array.isArray(data)) {
      // remove empty entries and clean each object
      const arr = data
        .map((it) => (typeof it === 'object' && it !== null ? cleanObject(it) : null))
        .filter((it) => it && Object.keys(it).length > 0);
      return arr;
    }
    if (typeof data === 'object' && data !== null) {
      return cleanObject(data);
    }
    return data;
  };

  const validate = () => {
    // if no input at all, allow save (means "Aucun contenu")
    const hasAny = isMulti
      ? Array.isArray(formData) &&
        formData.length > 0 &&
        formData.some((it) => Object.keys(cleanObject(it)).length > 0)
      : Object.keys(cleanObject(formData)).length > 0;
    if (!hasAny) return true;

    // otherwise enforce required fields
    if (isMulti) {
      for (const item of formData) {
        const cleaned = cleanObject(item || {});
        // for multi types, if item is empty skip it
        if (Object.keys(cleaned).length === 0) continue;
        for (const f of fields) {
          if (f.required) {
            if (
              !cleaned[f.name] ||
              (typeof cleaned[f.name] === 'string' && String(cleaned[f.name]).trim() === '')
            ) {
              setError(`Champ requis manquant : ${f.label}`);
              return false;
            }
            if (f.minLength && String(cleaned[f.name]).length < f.minLength) {
              setError(`Le champ ${f.label} doit contenir au moins ${f.minLength} caractères.`);
              return false;
            }
          }
        }
      }
    } else {
      const cleaned = cleanObject(formData || {});
      // if cleaned empty -> ok
      if (Object.keys(cleaned).length === 0) return true;
      for (const f of fields) {
        if (f.required) {
          if (
            !cleaned[f.name] ||
            (typeof cleaned[f.name] === 'string' && String(cleaned[f.name]).trim() === '')
          ) {
            setError(`Champ requis manquant : ${f.label}`);
            return false;
          }
          if (f.minLength && String(cleaned[f.name]).length < f.minLength) {
            setError(`Le champ ${f.label} doit contenir au moins ${f.minLength} caractères.`);
            return false;
          }
        }
      }
    }
    setError(null);
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((fd) => ({ ...fd, [name]: value }));
  };

  const handleSubmit = () => {
    setError(null);
    if (!validate()) return;
    const cleaned = cleanData(formData);
    // If cleaned is empty ({} or []), we pass empty to parent so it can interpret as no content
    onSave(cleaned);
  };

  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>Éditer la section « {type} »</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {isMulti ? (
          Array.isArray(formData) &&
          formData.map((item, idx) => (
            <Form key={idx} className="mb-3">
              {fields.map((f) => (
                <Form.Group key={f.name} className="mb-3">
                  <Form.Label>
                    {f.label}
                    {f.required && ' *'}
                  </Form.Label>
                  <Form.Control
                    name={f.name}
                    type={f.type || 'text'}
                    as={f.as || 'input'}
                    value={item[f.name] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((fd) => {
                        const copy = Array.isArray(fd) ? [...fd] : [];
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
                  {f.required && ' *'}
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
