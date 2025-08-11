// src/components/section/SectionPreview.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Aperçu en lecture seule du contenu d’une section.
 *
 * @param {any} data      Contenu de la section (objet, tableau, string ou number)
 * @returns {JSX.Element} Le rendu du composant SectionPreview
 */
export default function SectionPreview({ data }) {
  return (
    <div className="preview-card">
      <div className="preview-body">
        {/*
          Ici, vous pouvez adapter l’affichage en fonction du type et de la shape de `data`.
          Par exemple, si data est un objet { nom, prénom, job } :
        */}
        {typeof data === 'object' && !Array.isArray(data) ? (
          <ul>
            {Object.entries(data).map(([key, value]) => (
              <li key={key}>
                <strong>{key} :</strong> {value || <em>—</em>}
              </li>
            ))}
          </ul>
        ) : Array.isArray(data) ? (
          <ul>
            {data.length > 0 ? (
              data.map((item, i) => (
                <li key={i}>{typeof item === 'object' ? Object.values(item).join(' — ') : item}</li>
              ))
            ) : (
              <em>Aucun contenu</em>
            )}
          </ul>
        ) : (
          <div>{String(data)}</div>
        )}
      </div>
    </div>
  );
}

SectionPreview.propTypes = {
  type: PropTypes.string.isRequired,
  data: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
    PropTypes.string,
    PropTypes.number,
  ]),
};

SectionPreview.defaultProps = {
  data: null,
};
