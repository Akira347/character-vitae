import React from 'react';
import PropTypes from 'prop-types';
import SectionSelectorItem from './SectionSelectorItem';

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
