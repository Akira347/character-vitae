import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Container className="text-center py-5">
      <h1>404 – Page introuvable</h1>
      <p>Oups, cette page n’existe pas.</p>
      <Button as={Link} to="/" variant="primary">
        Retour à l’accueil
      </Button>
    </Container>
  );
}
