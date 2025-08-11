// src/components/avatar/AvatarPreview.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Image } from 'react-bootstrap';
import CroMagnonAvatar from '../../assets/avatars/cro-magnon-v1.webp';

/**
 * Aperçu simple de l’avatar :
 * - Affiche soit l’avatar fictif, soit la photo perso, ou les deux si mode "auto".
 *
 * @typedef AvatarData
 * @property {'avatar'|'photo'|'auto'} [affichage]  Mode d'affichage par défaut
 * @property {string} [photoUrl]                    URL de la photo personnelle (si fournie)
 * @property {File|null} [uploadedFile]             Fichier image sélectionné par l'utilisateur
 *
 * @param {object} props                            Props du composant (destructurées ci-dessous)
 * @param {AvatarData} [props.data]                 Données initiales de l'avatar (optionnel, voir Properties)
 * @returns {JSX.Element}                           Le rendu du composant AvatarPreview
 */
export default function AvatarPreview({ data }) {
  const { affichage, photoUrl } = data;

  return (
    <Row className="gy-2 text-center">
      {/** Si on affiche l’avatar fictif ou en mode “auto” */}
      {(affichage === 'avatar' || affichage === 'auto') && (
        <Col xs={12}>
          <p>Avatar fictif</p>
          <Image
            src={CroMagnonAvatar}
            rounded
            fluid
            style={{ maxHeight: 150 }}
            alt="Avatar fictif"
          />
        </Col>
      )}

      {/** Si on affiche la photo perso ou en mode “auto” */}
      {(affichage === 'photo' || affichage === 'auto') && (
        <Col xs={12}>
          <p>Photo personnelle</p>
          {photoUrl ? (
            <Image
              src={photoUrl}
              roundedCircle
              fluid
              style={{ maxHeight: 150 }}
              alt="Photo personnelle"
            />
          ) : (
            <div className="text-muted">Aucune URL renseignée</div>
          )}
        </Col>
      )}
    </Row>
  );
}

AvatarPreview.propTypes = {
  data: PropTypes.shape({
    affichage: PropTypes.oneOf(['avatar', 'photo', 'auto']).isRequired,
    photoUrl: PropTypes.string,
  }).isRequired,
};
