import '../styles/global.scss';
import '../styles/Dashboard.css';

import React, { useState } from 'react';
import { Row, Col, Card, Container } from 'react-bootstrap';
import SectionSelector from '../components/section/SectionSelector';
import SectionForm from '../components/section/SectionForm';
import { SECTION_TYPES } from '../constants/sectionTypes';
import AvatarEditor from '../components/avatar/AvatarEditor';
import SectionContainer from '../components/section/SectionContainer';
import SectionPreview from '../components/section/SectionPreview';
import AvatarInfoPanel from '../components/avatar/AvatarInfoPanel';

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
  const TOTAL_SLOTS = 15;
  const [sections, setSections] = useState(() => {
    const real = [];
    const empties = Array.from({ length: TOTAL_SLOTS - real.length }).map(() => ({
      type: 'empty',
    }));
    return [...real, ...empties];
  });

  const [activeTab, setActiveTab] = useState('sections');
  const [editing, setEditing] = useState({ show: false, sectionId: null });

  const [avatarData, setAvatarData] = useState({
    sexe: 'Homme',
    affichage: 'avatar',
    photoUrl: '',
  });
  const [avatarEditing, setAvatarEditing] = useState(false);

  // Hook DnD
  const { handleDragEnd, activeId, setActiveId } = useDragDrop(sections, setSections);
  const sensor = useSensor(PointerSensor);

  const handleAddSection = (type) => {
    // si déjà posée, on ne ré-ajoute pas
    if (sections.some((s) => s.type === type)) return;
    // on trouve le premier slot vide
    const idx = sections.findIndex((s) => s.type === 'empty');
    if (idx === -1) return; // plus de place
    const newSection = {
      id: `sec-${Date.now()}`,
      type,
      content: [],
      collapsed: false,
    };
    setSections((prev) => {
      const copy = [...prev];
      copy[idx] = newSection; // on remplace l’empty slot
      return copy;
    });
    setEditing({ show: true, sectionId: newSection.id });
  };

  const handleRemoveSection = (id) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { type: 'empty' }; // on remet un placeholder
      return copy;
    });
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
      onDragEnd={(event) => {
        const { active, over } = event;

        // 1) Si palette→placeholder => on gère nous-mêmes la création + modale
        if (active.id.startsWith('type-') && over?.id?.startsWith('empty-')) {
          const placeIdx = parseInt(over.id.replace('empty-', ''), 10);
          const typeName = active.id.replace(/^type-/, '');
          const newId = `sec-${Date.now()}`;
          const newSection = {
            id: newId,
            type: typeName,
            content: [],
            collapsed: false,
          };

          setSections((prev) => {
            const copy = [...prev];
            copy[placeIdx] = newSection;
            return copy;
          });
          // **ouvrir** la modale sur ce nouvel id
          setEditing({ show: true, sectionId: newId });
          return;
        }

        // 2) sinon on laisse handleDragEnd faire son boulot (reorder, palette→canvas, suppression…)
        handleDragEnd(event);
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <Row className="gy-4">
        {/* Palette */}
        <Col xs={12} md={3} lg={2}>
          <DroppableZone id="palette" style={{ padding: 0 }}>
            <div className="section-sidebar">
              <div className="tab-switcher">
                <button
                  className={activeTab === 'sections' ? 'active' : ''}
                  onClick={() => setActiveTab('sections')}
                >
                  Sections
                </button>
                <button
                  className={activeTab === 'avatar' ? 'active' : ''}
                  onClick={() => setActiveTab('avatar')}
                >
                  Avatar & Infos
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'sections' ? (
                  <SectionSelector
                    availableTypes={SECTION_TYPES.filter(
                      (t) => !sections.some((s) => s.type === t),
                    )}
                    onAddSection={handleAddSection}
                  />
                ) : (
                  <AvatarInfoPanel data={avatarData} onEditAvatar={() => setAvatarEditing(true)} />
                )}
              </div>
            </div>
          </DroppableZone>
        </Col>

        {/* Canvas & Avatar */}
        <Col xs={12} md={9} lg={10}>
          <Container fluid className="p-0">
            <Card className="mb-4">
              <Card.Body className="dashboard-sections">
                <SortableContext items={sections.map((s) => s.id)} strategy={rectSortingStrategy}>
                  {sections.map((sec, idx) => (
                    <SectionContainer
                      key={sec.id ?? `empty-${idx}`}
                      id={sec.id ?? `empty-${idx}`}
                      type={sec.type}
                      onToggle={toggleCollapse}
                      onEdit={sec.type !== 'empty' ? handleEditClick : null}
                      onDelete={
                        sec.type === 'empty' || sec.id === 'sec-avatar' ? null : handleRemoveSection
                      }
                      collapsed={sec.collapsed}
                      isDragging={activeId === sec.id}
                    >
                      {sec.type !== 'empty' && (
                        <div className="section-content">
                          <SectionPreview type={sec.type} data={sec.content} />
                        </div>
                      )}
                    </SectionContainer>
                  ))}
                </SortableContext>
              </Card.Body>
            </Card>

            {/* Formulaire de section*/}
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
              data={avatarData}
              onSave={(newAvatarData) => {
                setAvatarData(newAvatarData);
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
