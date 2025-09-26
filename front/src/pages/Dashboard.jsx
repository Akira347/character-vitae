import '../styles/Dashboard.css';

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Row, Col, Card, Container, Button } from 'react-bootstrap';
import SectionSelector from '../components/section/SectionSelector';
import SectionForm from '../components/section/SectionForm';
import { SECTION_TYPES } from '../constants/sectionTypes';
import AvatarEditor from '../components/avatar/AvatarEditor';
import SectionContainer from '../components/section/SectionContainer';
import SectionPreview from '../components/section/SectionPreview';
import AvatarInfoPanel from '../components/avatar/AvatarInfoPanel';
import { AuthContext } from '../contexts/AuthContext';
import useUnsavedWarning from '../hooks/useUnsavedWarning';

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
import { fetchJson } from '../utils/api';

/**
 * Tableau de bord principal :
 * - Palette de sections / Avatar & Infos à gauche
 * - Canvas de sections à droite
 * - Gestion drag&drop via DnD-kit
 * 
 * Props:
 * - characterId: string|null
 * - initialCharacter: object|null (peut contenir layout, avatar, sections, etc.)
 *
 * @returns {JSX.Element} Le rendu du composant Dashboard
 */
export default function Dashboard({ characterId = null, initialCharacter = null }) {
  const { token } = useContext(AuthContext);
  const TOTAL_SLOTS = 15;

  const parseLayoutToSections = useCallback((layout) => {
    if (!layout || !Array.isArray(layout.rows)) {
      // default empty placeholders
      return Array.from({ length: TOTAL_SLOTS }).map((_, i) => ({ type: 'empty' }));
    }
    // flatten rows preserving order
    const flat = [];
    for (const row of layout.rows) {
      for (const cell of row) {
        flat.push({
          id: cell.id ?? `sec-${Date.now()}-${flat.length}`,
          type: cell.type ?? 'empty',
          content: cell.content ?? (cell.type === 'empty' ? null : []),
          collapsed: !!cell.collapsed,
          width: cell.width ?? undefined,
        });
      }
    }
    // pad / slice to TOTAL_SLOTS
    const out = flat.slice(0, TOTAL_SLOTS);
    while (out.length < TOTAL_SLOTS) out.push({ type: 'empty' });
    return out;
  }, []);

  const [sections, setSectionsRaw] = useState(() => {
    if (initialCharacter?.layout) {
      return parseLayoutToSections(initialCharacter.layout);
    }
    // initial empty
    const real = [];
    const empties = Array.from({ length: TOTAL_SLOTS - real.length }).map(() => ({ type: 'empty' }));
    return [...real, ...empties];
  });

  // track dirty state
  const [isDirty, setIsDirty] = useState(false);
  useUnsavedWarning(isDirty, 'Modifications non sauvegardées — quitter sans sauvegarder ?');

  // wrap setSections to mark dirty
  const setSections = (updater) => {
    setIsDirty(true);
    setSectionsRaw(updater);
  };

  // avatar initial
  const [avatarData, setAvatarData] = useState(() => initialCharacter?.avatar ?? {
    sexe: 'Homme',
    affichage: 'avatar',
    photoUrl: '',
  });
  const [avatarEditing, setAvatarEditing] = useState(false);

  useEffect(() => {
    if (initialCharacter?.avatar) {
      setAvatarData(initialCharacter.avatar);
    }
  }, [initialCharacter]);

  // if loaded later, override sections
  useEffect(() => {
    if (initialCharacter?.layout) {
      setSectionsRaw(parseLayoutToSections(initialCharacter.layout));
    }
  }, [initialCharacter, parseLayoutToSections]);

  // mark dirty if avatar changes
  useEffect(() => {
    // if initialCharacter present, compare shallow
    if (!initialCharacter) return;
    // naive compare: if avatar differs set dirty
    if (JSON.stringify(avatarData) !== JSON.stringify(initialCharacter.avatar)) {
      setIsDirty(true);
    }
  }, [avatarData, initialCharacter]);

  const [activeTab, setActiveTab] = useState('sections');

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

  // saveCharacter avec token
  const saveCharacter = useCallback(async () => {
    if (!characterId) {
      alert('Aucun character sélectionné à sauvegarder.');
      return;
    }
    try {
      const rows = [];
      for (let r = 0; r < 3; r++) {
        const row = [];
        for (let c = 0; c < 5; c++) {
          const idx = r * 5 + c;
          const s = sections[idx] ?? { type: 'empty' };
          row.push({
            id: s.id ?? `s${idx + 1}`,
            type: s.type,
            width: s.width ?? undefined,
            content: s.content ?? (s.type === 'empty' ? null : s.content ?? []),
            isOpen: s.isOpen ?? !s.collapsed,
          });
        }
        rows.push(row);
      }

      const payload = {
        title: initialCharacter?.title ?? 'Untitled',
        description: initialCharacter?.description ?? null,
        templateType: initialCharacter?.templateType ?? null,
        layout: { rows },
        avatar: avatarData,
      };

      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      await fetchJson(`/apip/characters/${characterId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      setIsDirty(false);
      alert('Sauvegarde effectuée.');
    } catch (err) {
      console.error('Save error', err);
      alert('Erreur lors de la sauvegarde : ' + (err.message || 'erreur'));
    }
  }, [characterId, sections, avatarData, initialCharacter, token]);

  // écoute l'évènement global déclenché par le Header
  useEffect(() => {
    const onSave = () => {
      saveCharacter();
    };
    window.addEventListener('save-character', onSave);
    return () => window.removeEventListener('save-character', onSave);
  }, [saveCharacter]);

  // UI state for editing sections
  const [editing, setEditing] = useState({ show: false, sectionId: null });

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
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 style={{ margin: 0 }}>Palette</h6>
                <div>
                  <Button size="sm" variant={isDirty ? 'warning' : 'outline-secondary'} onClick={saveCharacter}>
                    {isDirty ? 'Sauvegarder*' : 'Sauvegarder'}
                  </Button>
                </div>
              </div>

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
                <SortableContext items={sections.map((s) => s.id ?? `empty-${Math.random()}`)} strategy={rectSortingStrategy}>
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
