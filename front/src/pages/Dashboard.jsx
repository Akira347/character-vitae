import '../styles/Dashboard.css';
import '../styles/theme.css';

import React, { useState } from 'react';
import { Row, Col, Card, Container } from 'react-bootstrap';
import SectionSelector from '../components/section/SectionSelector';
import SectionForm from '../components/section/SectionForm';
import { SECTION_TYPES } from '../constants/sectionTypes';
import AvatarEditor from '../components/avatar/AvatarEditor';
import SectionContainer from '../components/section/SectionContainer';
import AvatarPreview from '../components/avatar/AvatarPreview';
import SectionPreview from '../components/section/SectionPreview';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';

import { useDragDrop, DroppableZone } from '../tools/dragDrop';

export default function Dashboard() {
  const [editing, setEditing] = useState({ show: false, sectionId: null });
  const [sections, setSections] = useState([
    {
      id: 'sec-avatar',
      type: 'Avatar',
      content: { nom: '', prénom: '', pseudo: '', avatarUrl: null },
      collapsed: false,
    },
  ]);
  const [avatarEditing, setAvatarEditing] = useState(false);

  // Hook DnD
  const { handleDragEnd, activeId, setActiveId } = useDragDrop(sections, setSections);
  const sensor = useSensor(PointerSensor);

  const handleAddSection = (type) => {
    if (sections.some((s) => s.type === type)) return;
    const newSection = { id: `sec-${Date.now()}`, type, content: [] };
    setSections((prev) => [...prev, newSection]);
    setEditing({ show: true, sectionId: newSection.id });
  };

  const handleRemoveSection = (id) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  // Au lieu de handleAddSectionClick, on gère tous les clics “éditer”
  const handleEditClick = (id) => {
    if (id === 'sec-avatar') {
      setAvatarEditing(true);
    } else {
      setEditing({ show: true, sectionId: id });
    }
  };

  const toggleCollapse = (id) => {
    setSections((secs) => secs.map((s) => (s.id === id ? { ...s, collapsed: !s.collapsed } : s)));
  };

  return (
    <DndContext
      sensors={useSensors(sensor)}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <Row className="gy-4">
        {/* Palette */}
        <Col xs={12} md={4} lg={3}>
          <DroppableZone id="palette" style={{ padding: 0 }}>
            <SectionSelector
              availableTypes={SECTION_TYPES.filter((t) => !sections.some((s) => s.type === t))}
              onAddSection={handleAddSection}
            />
          </DroppableZone>
        </Col>

        {/* Canvas & Avatar */}
        <Col xs={12} md={8} lg={9}>
          <Container fluid className="p-0">
            {/* Ta boîte Édition du CV */}
            <Card className="mb-4">
              <Card.Header>Édition du CV</Card.Header>
              <Card.Body className="d-flex flex-wrap" style={{ minHeight: '60vh' }}>
                <SortableContext items={sections.map((s) => s.id)} strategy={rectSortingStrategy}>
                  {sections.map((sec) => (
                    <SectionContainer
                      key={sec.id}
                      id={sec.id}
                      type={sec.type}
                      isDragging={activeId === sec.id}
                      onToggle={toggleCollapse}
                      collapsed={sec.collapsed}
                      onEdit={handleEditClick}
                      onDelete={sec.id === 'sec-avatar' ? null : handleRemoveSection}
                    >
                      {/* Affichage du contenu réellement saisi */}
                      <div className="section-content">
                        {sec.type === 'Avatar' ? (
                          /* AvatarEditor inline ou preview Avatar */
                          <AvatarPreview data={sec.content} />
                        ) : (
                          /* Pour les autres sections, on peut lister les champs */
                          <SectionPreview type={sec.type} data={sec.content} />
                        )}
                      </div>
                    </SectionContainer>
                  ))}
                </SortableContext>
              </Card.Body>
            </Card>

            {/* Formulaire de section */}
            <SectionForm
              show={editing.show}
              type={sections.find((s) => s.id === editing.sectionId)?.type}
              initialData={sections.find((s) => s.id === editing.sectionId)?.content}
              onSave={(data) => {
                setSections((prev) =>
                  prev.map((s) => (s.id === editing.sectionId ? { ...s, content: data } : s)),
                );
                setEditing({ show: false, sectionId: null });
              }}
              onCancel={() => setEditing({ show: false, sectionId: null })}
            />

            {/* pour l’avatar */}
            <AvatarEditor
              show={avatarEditing}
              data={sections.find((s) => s.id === 'sec-avatar').content}
              onSave={(newAvatarData) => {
                setSections((prev) =>
                  prev.map((s) => (s.id === 'sec-avatar' ? { ...s, content: newAvatarData } : s)),
                );
                setAvatarEditing(false);
              }}
              onCancel={() => setAvatarEditing(false)}
            />
          </Container>
        </Col>
      </Row>

      {/* Overlay pendant le drag */}
      <DragOverlay>
        {activeId?.startsWith('type-') && (
          <div className="p-2 bg-warning border">
            <strong>{activeId.replace('type-', '')}</strong>
          </div>
        )}
        {sections.find((s) => s.id === activeId) && (
          <div className="p-2 bg-info border">
            <strong>{sections.find((s) => s.id === activeId)?.type}</strong>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

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
