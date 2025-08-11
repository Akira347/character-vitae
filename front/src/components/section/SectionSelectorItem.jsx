import React from 'react';
import PropTypes from 'prop-types';
import { useDraggable } from '@dnd-kit/core';
import {
  User,
  BookOpen,
  Phone,
  Puzzle,
  Star,
  Sword,
  ScrollText,
  ShieldPlus,
  Languages,
  Guitar,
} from 'lucide-react';

const ICONS = {
  Identité: User,
  Lore: BookOpen,
  Quêtes: ScrollText,
  Contact: Phone,
  NewbiePark: Puzzle,
  HautsFaits: Star,
  Talents: Sword,
  Qualités: ShieldPlus,
  Langues: Languages,
  Hobbies: Guitar,
};

/**
 * Élément de la palette draggable + bouton d’ajout.
 *
 * @param {object} props                Props du composant
 * @param {string} props.type           Type de section sélectionnée (ex: "Identité")
 * @param {Function} props.onAddSection Callback appelé avec (type) au clic sur "+"
 * @returns {JSX.Element}               Le rendu du composant SectionSelectorItem
 */
export default function SectionSelectorItem({ type, onAddSection }) {
  // Hook dnd-kit pour rendre l'élément draggable
  const { attributes, listeners, setNodeRef, transform, transition } = useDraggable({
    id: `type-${type}`,
  });

  const dragStyle = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    cursor: 'grab',
    display: 'inline-block',
    marginRight: '0.5rem',
  };

  const Icon = ICONS[type] || (() => null);

  return (
    <div
      ref={setNodeRef}
      className="d-flex align-items-center p-2 mb-2 border rounded bg-light section-parchment"
      style={{ justifyContent: 'space-between' }}
    >
      <div className="d-flex align-items-center">
        {/* Poignée de drag */}
        <span {...listeners} {...attributes} style={dragStyle} title="Glisser pour ajouter">
          ⠿
        </span>
        <Icon size={20} className="me-2" />
        <span>{type}</span>
      </div>
      {/* Bouton d’ajout par clic */}
      <button
        type="button"
        className="btn btn-sm btn-success"
        onClick={() => onAddSection(type)}
        aria-label={`Ajouter la section ${type}`}
      >
        +
      </button>
    </div>
  );
}

SectionSelectorItem.propTypes = {
  type: PropTypes.string.isRequired,
  onAddSection: PropTypes.func.isRequired,
};
