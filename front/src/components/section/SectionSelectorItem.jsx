import React from 'react';
import PropTypes from 'prop-types';
import { User, BookOpen, Clipboard, Phone, Puzzle, Star } from 'lucide-react';

const ICONS = {
  Identité: User,
  Lore: BookOpen,
  Expériences: Clipboard,
  Contact: Phone,
  Formations: Puzzle,
  Certifications: Star,
  // ajoute les autres mappings ici…
};

export default function SectionSelectorItem({ type, onClick }) {
  const Icon = ICONS[type] || (() => null);

  return (
    <button
      type="button"
      className="d-flex align-items-center p-2 mb-2 border rounded w-100 bg-light"
      onClick={() => onClick(type)}
    >
      <Icon size={20} className="me-2" />
      <span>{type}</span>
    </button>
  );
}

SectionSelectorItem.propTypes = {
  type: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};
