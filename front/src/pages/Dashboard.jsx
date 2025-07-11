// src/pages/Dashboard.jsx
import '../styles/Dashboard.css';

import React, { useState } from 'react';
import { Row, Col, Card, ProgressBar, Image } from 'react-bootstrap';
import SectionSelector from '../components/section/SectionSelector';
import PreviewCard from '../components/section/PreviewCard';

import { DragDropContainer, SortableSection } from '../tools/dragDrop';

export default function Dashboard() {
  const [sections, setSections] = useState([]);

  const handleAddSection = (type) => {
    setSections([...sections, { id: Date.now().toString(), type, content: null }]);
  };

  return (
    <Row className="gy-4">
      {/* Colonne de gauche */}
      <Col lg={3} md={4}>
        <Card className="text-center">
          <Card.Body>
            <Image src="/path/to/avatar.jpg" roundedCircle fluid className="mb-3" />
            <h5>Nom du personnage</h5>
            <ProgressBar now={45} label="45 % XP" />
          </Card.Body>
        </Card>
        <SectionSelector onAddSection={handleAddSection} />
      </Col>

      {/* Canvas d’édition */}
      <Col lg={6} md={8}>
        <Card>
          <Card.Header>Édition du CV</Card.Header>
          <Card.Body className="d-flex flex-wrap" style={{ minHeight: '60vh' }}>
            {sections.length === 0 && <p className="text-muted">Glissez vos sections ici…</p>}

            <DragDropContainer sections={sections} setSections={setSections}>
              {sections.map((sec) => (
                <SortableSection key={sec.id} id={sec.id}>
                  <Card className="h-100">
                    <Card.Body>
                      <strong>{sec.type}</strong>
                      {/* Plus tard : inline form pour éditer sec.content */}
                    </Card.Body>
                  </Card>
                </SortableSection>
              ))}
            </DragDropContainer>
          </Card.Body>
        </Card>
      </Col>

      {/* Prévisualisation */}
      <Col lg={3} className="d-none d-lg-block">
        <Card>
          <Card.Header>Prévisualisation</Card.Header>
          <Card.Body style={{ minHeight: '60vh' }}>
            {sections.map((sec) => (
              <PreviewCard key={sec.id} type={sec.type}>
                <em>Aucun contenu pour l’instant.</em>
              </PreviewCard>
            ))}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
