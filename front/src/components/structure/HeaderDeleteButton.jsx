// src/components/structure/HeaderDeleteButton.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';
import { fetchJson } from '../../utils/api';

export default function HeaderDeleteButton({ selectedCharId, token }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!selectedCharId) return <div style={{ width: 12 }} />;

  const handleDelete = async () => {
    if (!selectedCharId) return;
    setDeleting(true);
    try {
      const idStr = encodeURIComponent(String(selectedCharId));
      await fetchJson(`/apip/characters/${idStr}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setDeleting(false);
      setConfirmOpen(false);

      // notify header to refresh and pick next item
      window.dispatchEvent(
        new CustomEvent('character-deleted', { detail: { id: selectedCharId } }),
      );
      window.dispatchEvent(
        new CustomEvent('notify', {
          detail: { message: 'Fiche supprimée', variant: 'success', timeout: 2500 },
        }),
      );
    } catch (err) {
      console.error('delete character', err);
      setDeleting(false);
      window.dispatchEvent(
        new CustomEvent('notify', {
          detail: { message: 'Erreur suppression', variant: 'danger', timeout: 4000 },
        }),
      );
    }
  };

  return (
    <>
      <div className="me-2">
        <Button
          variant="danger"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          title="Supprimer la fiche sélectionnée"
          aria-label="Supprimer la fiche sélectionnée"
          className="d-flex align-items-center justify-content-center"
          style={{
            minWidth: 40,
            minHeight: 36,
            padding: '0.25rem 0.5rem',
            borderRadius: 6,
            boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
          }}
        >
          <FaTrash color="#fff" style={{ width: 16, height: 16 }} />
        </Button>
      </div>

      <Modal show={confirmOpen} onHide={() => setConfirmOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Voulez-vous vraiment supprimer cette fiche ? Cette action est irréversible.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" /> Suppression…
              </>
            ) : (
              'Supprimer'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

HeaderDeleteButton.propTypes = {
  selectedCharId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  token: PropTypes.string,
};

HeaderDeleteButton.defaultProps = {
  selectedCharId: null,
  token: null,
};
