import React from 'react';
import { Container } from 'react-bootstrap';

/**
 * Footer global de l’application.
 * Affiche le copyright et l’année courante.
 *
 * @returns {JSX.Element} Le rendu du composant Footer
 */
export default function Footer() {
  return (
    <footer className="text-light py-3 mt-auto">
      <Container className="text-center">
        <small>&copy; {new Date().getFullYear()} Character Vitae. Tous droits réservés.</small>
      </Container>
    </footer>
  );
}
