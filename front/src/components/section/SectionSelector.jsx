import React from 'react';
import PropTypes from 'prop-types';
import SectionSelectorItem from './SectionSelectorItem';

/**
 * Palette de tous les types de sections disponibles.
 *
 * @param {object} props                  Les props du composant
 * @param {string[]} props.availableTypes Types qu’on peut encore ajouter
 * @param {Function} props.onAddSection   Callback(type) au clic sur "+"
 * @returns {JSX.Element}                 Le rendu du composant SectionSelector
 */
export default function SectionSelector({ availableTypes, onAddSection }) {
  return (
    <div className="p-3 bg-white shadow-sm">
      {availableTypes.length === 0 && (
        <p className="text-muted">Toutes les sections ont été ajoutées.</p>
      )}
      {availableTypes.map((type) => (
        <SectionSelectorItem key={type} type={type} onAddSection={onAddSection} />
      ))}
    </div>
  );
}

SectionSelector.propTypes = {
  availableTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddSection: PropTypes.func.isRequired,
};
