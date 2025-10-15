// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import heroImg from '/templates/t1.png';
import '../styles/home.css';

export default function Home() {
  const navigate = useNavigate();

  const openSignup = () => {
    window.dispatchEvent(new CustomEvent('open-signup'));
  };

  return (
    <Container className="py-5">
      <Row className="align-items-center">
        <Col md={6} className="mb-4 mb-md-0">
          <h1 className="display-5">Créez votre CV façon RPG — simple, rapide, fun</h1>
          <p className="lead text-muted">
            Jouez votre histoire : sections modulables, modèles thématiques, et un éditeur drag &
            drop intuitif.
          </p>

          <div className="mt-4">
            <Button variant="warning" size="lg" className="me-3" onClick={openSignup}>
              Créer un compte
            </Button>
            <Button variant="outline-secondary" size="lg" onClick={() => navigate('/demo')}>
              Voir le profil de démonstration
            </Button>
          </div>
        </Col>

        <Col md={6} className="text-center">
          {/* image agrandie — max width 720px (approx 720p) */}
          <img
            src={heroImg}
            alt="Exemple de fiche"
            style={{
              maxWidth: 720,
              width: '100%',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}
          />
        </Col>
      </Row>

      <Row className="mt-5">
        <Col md={4}>
          <Card className="feature-card">
            <Card.Body>
              <Card.Title>Simple & puissant</Card.Title>
              <Card.Text className="text-muted">
                Glissez, déposez, organisez vos sections — tout se fait en quelques clics.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mt-3 mt-md-0">
          <Card className="feature-card">
            <Card.Body>
              <Card.Title>Pourquoi ce format ?</Card.Title>
              <Card.Text className="text-muted">
                Un format structuré et exportable, pensé pour garder la flexibilité du design.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mt-3 mt-md-0">
          <Card className="feature-card">
            <Card.Body>
              <Card.Title>Sécurité</Card.Title>
              <Card.Text className="text-muted">
                Vos données restent privées — contrôlez qui voit votre fiche.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
