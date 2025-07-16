import '../styles/Dashboard.css';
import '../styles/theme.css';

import React, { useState } from 'react';
import { Row, Col, Card, ProgressBar, Image } from 'react-bootstrap';
import SectionSelector from '../components/section/SectionSelector';
import PreviewCard from '../components/section/PreviewCard';
import SectionForm from '../components/section/SectionForm';
import { SECTION_TYPES } from '../constants/sectionTypes';

import { DragDropContainer, SortableSection } from '../tools/dragDrop';

export default function Dashboard() {
  const [editing, setEditing] = useState({ show: false, sectionId: null });
  const [sections, setSections] = useState([]);

  const handleAddSection = (type) => {
    // Empêcher les doublons
    if (sections.some((s) => s.type === type)) return;
    // Création de la section
    const newSection = { id: Date.now().toString(), type, content: [] };
    setSections((prev) => [...prev, newSection]);
    // Ouvrir la modale pour la nouvelle section
    setEditing({ show: true, sectionId: newSection.id });
  };

  // Supprimer une section du canvas
  const handleRemoveSection = (id) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSectionClick = (sectionId) => {
    console.log('clic section', sectionId);
    setEditing({ show: true, sectionId });
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
        <SectionSelector
          availableTypes={SECTION_TYPES.filter((t) => !sections.some((s) => s.type === t))}
          onAddSection={handleAddSection}
        />
      </Col>

      {/* Canvas d’édition */}
      <Col lg={6} md={8}>
        <Card>
          <Card.Header>Édition du CV</Card.Header>
          <Card.Body className="d-flex flex-wrap" style={{ minHeight: '60vh' }}>
            {sections.length === 0 && <p className="text-muted">Glissez vos sections ici…</p>}

            <DragDropContainer
              sections={sections}
              setSections={setSections}
              onSectionClick={handleAddSectionClick}
            >
              {sections.map((sec) => (
                <SortableSection
                  key={sec.id}
                  id={sec.id}
                  onSectionClick={handleAddSectionClick} // ← on passe bien la fonction ici
                >
                  <Card className="h-100">
                    <Card.Body>
                      <strong>{sec.type}</strong>
                    </Card.Body>
                    {/* Bouton suppression */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sec.id)}
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      aria-label="Supprimer"
                    >
                      ✕
                    </button>
                  </Card>
                </SortableSection>
              ))}
            </DragDropContainer>
          </Card.Body>
        </Card>
        <SectionForm
          show={editing.show}
          type={sections.find((s) => s.id === editing.sectionId)?.type}
          initialData={sections.find((s) => s.id === editing.sectionId)?.content}
          onSave={async (data) => {
            setSections(
              sections.map((s) => (s.id === editing.sectionId ? { ...s, content: data } : s)),
            );

            // Futur appel API pour persister côté serveur
            // try {
            //   await fetch(`/api/characters/${characterId}/sections`, {
            //     method: 'POST', // ou PUT si tu mets à jour
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //       sectionId: editing.sectionId,
            //       type: /* le type */,
            //       content: data
            //     })
            //   });
            // } catch (err) {
            //   console.error('Erreur de sauvegarde', err);
            //   // idéalement, remonter l’erreur à l’utilisateur
            // }

            setEditing({ show: false, sectionId: null });
          }}
          onCancel={() => setEditing({ show: false, sectionId: null })}
        />
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
