import React from 'react';
import PropTypes from 'prop-types';
import SectionSelectorItem from './SectionSelectorItem';

const SECTION_TYPES = [
  'Identité',
  'Lore',
  'Formations',
  'Certifications',
  'Soft‑skills',
  'Talents',
  'Expériences',
  'Contact',
  'Inventaire',
];

export default function SectionSelector({ onAddSection }) {
  return (
    <div className="p-3 bg-white shadow-sm">
      <h5>Ajouter une section</h5>
      {SECTION_TYPES.map((type) => (
        <SectionSelectorItem key={type} type={type} onClick={onAddSection} />
      ))}
    </div>
  );
}

SectionSelector.propTypes = {
  onAddSection: PropTypes.func.isRequired,
};
