import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'react-bootstrap';
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

export default function PreviewCard({ type, children }) {
  const Icon = ICONS[type] || (() => null);

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex align-items-center">
        <Icon size={18} className="me-2" />
        <strong>{type}</strong>
      </Card.Header>
      <Card.Body>{children /* ici le contenu de la section (texte, liste…) */}</Card.Body>
    </Card>
  );
}

PreviewCard.propTypes = {
  type: PropTypes.string.isRequired,
  children: PropTypes.node,
};

PreviewCard.defaultProps = {
  children: null,
};
