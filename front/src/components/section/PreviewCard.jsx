import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'react-bootstrap';
import { User, BookOpen, Clipboard, Phone, Puzzle, Star } from 'lucide-react';

const ICONS = {
    Identité: User,
    Lore: BookOpen,
    Expériences: Clipboard,
    Contact: Phone,
    Formations: Puzzle,
    Certifications: Star,
  // …
};

export default function PreviewCard({ type, children }) {
  const Icon = ICONS[type] || (() => null);

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex align-items-center">
        <Icon size={18} className="me-2" />
        <strong>{type}</strong>
      </Card.Header>
      <Card.Body>
        {children /* ici le contenu de la section (texte, liste…) */}
      </Card.Body>
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
