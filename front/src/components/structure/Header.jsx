import React, { useState } from 'react';
import { Navbar, Container, Nav, Modal, Button, Form } from 'react-bootstrap';
import PlumeIcon from '../../assets/icons/plume.png';
import { Link } from 'react-router-dom';

/**
 * Header principal de l’application.
 *
 * Affiche la marque, l’icône de connexion et gère l’ouverture
 * de la modale de login.
 *
 * @returns {JSX.Element} Le rendu du composant Header
 */
export default function Header() {
  const [show, setShow] = useState(false);
  return (
    <>
      <Navbar expand="lg" className="px-3">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="brand-logo">
            Character Vitae
          </Navbar.Brand>
          <Nav className="ms-auto">
            {/* icône plume */}
            <Nav.Link onClick={() => setShow(true)}>
              <img
                src={PlumeIcon}
                alt="Connexion"
                style={{ width: 56, height: 56, objectFit: 'contain' }}
              />
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      {/* Modale de connexion */}
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Se connecter</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Adresse e-mail</Form.Label>
              <Form.Control type="email" placeholder="email@exemple.com" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mot de passe</Form.Label>
              <Form.Control type="password" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              /* TODO: handle login */
            }}
          >
            Connexion
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
