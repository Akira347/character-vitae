import React from 'react';
import { Container } from 'react-bootstrap';

export default function Footer() {
  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <Container className="text-center">
        <small>&copy; {new Date().getFullYear()} Character Vitae. Tous droits réservés.</small>
      </Container>
    </footer>
  );
}
