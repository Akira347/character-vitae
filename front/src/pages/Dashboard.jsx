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

export default function Dashboard({
  characterId = null,
  initialCharacter = null,
  readOnly = false,
}) {
  const { token } = useContext(AuthContext) || {};
  const TOTAL_SLOTS = 15;

  const parseLayoutToSections = useCallback((layout) => {
    if (!layout || !Array.isArray(layout.rows)) {
      return Array.from({ length: TOTAL_SLOTS }).map((_, i) => ({
        id: `empty-${i}`,
        type: 'empty',
        content: null,
        collapsed: true,
      }));
    }

    const flat = [];
    const seen = new Set();
    for (let r = 0; r < layout.rows.length; r++) {
      const row = layout.rows[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        const cell = row[c] ?? {};

        const rawId = typeof cell.id === 'string' ? cell.id : `s-${flat.length + 1}`;
        let id = rawId;
        if (!id.startsWith('sec-') && id !== 'sec-avatar') {
          id = `sec-${id}`;
        }
        if (seen.has(id)) {
          id = `${id}-${flat.length}-${Date.now()}`;
        }
        seen.add(id);

        flat.push({
          id,
          type: typeof cell.type === 'string' ? cell.type : 'empty',
          content: Object.prototype.hasOwnProperty.call(cell, 'content')
            ? cell.content
            : cell.type === 'empty'
              ? null
              : [],
          collapsed: !!(cell.isCollapsed ?? cell.collapsed ?? true),
          width: cell.width ?? undefined,
          originalId: rawId,
        });
      }
    }

    const out = flat.slice(0, TOTAL_SLOTS);
    while (out.length < TOTAL_SLOTS) {
      out.push({
        id: `empty-${out.length}`,
        type: 'empty',
        content: null,
        collapsed: true,
      });
    }

    return out;
  }, []);

  const [sections, setSectionsRaw] = useState(() => {
    if (initialCharacter?.layout) {
      return parseLayoutToSections(initialCharacter.layout);
    }
    return Array.from({ length: TOTAL_SLOTS }).map((_, i) => ({
      id: `empty-${i}`,
      type: 'empty',
      content: null,
      collapsed: true,
    }));
  });

  useEffect(() => {
    if (initialCharacter?.layout) {
      setSectionsRaw(parseLayoutToSections(initialCharacter.layout));
    }
  }, [initialCharacter, parseLayoutToSections]);

  const [isDirty, setIsDirty] = useState(false);
  useUnsavedWarning(isDirty, 'Modifications non sauvegardées — quitter sans sauvegarder ?');

  const setSections = (updater) => {
    setIsDirty(true);
    setSectionsRaw((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  };

  const [avatarData, setAvatarData] = useState(
    () => initialCharacter?.avatar ?? { sexe: 'Homme', affichage: 'avatar', photoUrl: '' },
  );
  const [avatarEditing, setAvatarEditing] = useState(false);

  useEffect(() => {
    if (initialCharacter?.avatar) {
      setAvatarData(initialCharacter.avatar);
    }
  }, [initialCharacter]);

  useEffect(() => {
    if (!initialCharacter) return;
    if (JSON.stringify(avatarData) !== JSON.stringify(initialCharacter.avatar)) {
      setIsDirty(true);
    }
  }, [avatarData, initialCharacter]);

  const [activeTab, setActiveTab] = useState('sections');

  // Drag/drop helpers — only initialised if not readOnly
  const { handleDragEnd, activeId, setActiveId } = useDragDrop(sections, setSections);
  const sensor = useSensor(PointerSensor);

  const handleAddSection = (type) => {
    if (readOnly) return;
    if (sections.some((s) => s.type === type)) return;
    const idx = sections.findIndex((s) => s.type === 'empty');
    if (idx === -1) return;
    const newSection = {
      id: `sec-${Date.now()}`,
      type,
      content: [],
      collapsed: false,
    };
    setSections((prev) => {
      const copy = [...prev];
      copy[idx] = newSection;
      return copy;
    });
  };

  const handleRemoveSection = (id) => {
    if (readOnly) return;
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { id: `empty-${idx}`, type: 'empty', content: null, collapsed: true };
      return copy;
    });
  };

  const toggleCollapse = (id) => {
    setSections((secs) => secs.map((s) => (s.id === id ? { ...s, collapsed: !s.collapsed } : s)));
  };

  // Save — unchanged (header triggers); Dashboard only emits save-character event listened elsewhere
  const saveCharacter = async () => {
    // no-op here; Header triggers save via event
    return;
  };

  // Editing state (local SectionForm)
  const [editing, setEditing] = useState({ show: false, sectionId: null });

  // Helper: render sections (used in both readOnly and interactive mode)
  const renderSections = () =>
    sections.map((sec, idx) => (
      <SectionContainer
        key={sec.id ?? `empty-${idx}`}
        id={sec.id ?? `empty-${idx}`}
        type={sec.type}
        onToggle={toggleCollapse}
        onEdit={
          readOnly
            ? null
            : sec.type !== 'empty'
              ? (id) => setEditing({ show: true, sectionId: id })
              : null
        }
        onDelete={
          readOnly || sec.type === 'empty' || sec.id === 'sec-avatar' ? null : handleRemoveSection
        }
        collapsed={sec.collapsed}
        isDragging={activeId === sec.id}
        readOnly={readOnly}
      >
        {sec.type !== 'empty' && (
          <div className="section-content">
            <SectionPreview type={sec.type} data={sec.content} />
          </div>
        )}
      </SectionContainer>
    ));

  // If readOnly: render a static layout without DnD wrappers
  if (readOnly) {
    return (
      <div className="dashboard-readonly">
        <Row className="gy-4">
          <Col xs={12} md={3} lg={2}>
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
                  <div style={{ padding: 10 }}>Aperçu — lecture seule</div>
                ) : (
                  <AvatarInfoPanel data={avatarData} onEditAvatar={() => {}} />
                )}
              </div>
            </div>
          </Col>

          <Col xs={12} md={9} lg={10}>
            <Container fluid className="p-0">
              <Card className="mb-4">
                <Card.Body className="dashboard-sections">{renderSections()}</Card.Body>
              </Card>
            </Container>
          </Col>
        </Row>
      </div>
    );
  }

  // Interactive mode (original behaviour with DnD)
  return (
    <DndContext
      sensors={useSensors(sensor)}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={(event) => {
        const { active, over } = event;

        if (active.id.startsWith('type-') && over?.id?.startsWith('empty-')) {
          const placeIdx = parseInt(over.id.replace('empty-', ''), 10);
          const typeName = active.id.replace(/^type-/, '');
          const newId = `sec-${Date.now()}`;
          const newSection = { id: newId, type: typeName, content: [], collapsed: false };

          setSections((prev) => {
            const copy = [...prev];
            copy[placeIdx] = newSection;
            return copy;
          });
          setEditing({ show: true, sectionId: newId });
          return;
        }

        handleDragEnd(event);
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <Row className="gy-4">
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

        <Col xs={12} md={9} lg={10}>
          <Container fluid className="p-0">
            <Card className="mb-4">
              <Card.Body className="dashboard-sections">
                <SortableContext
                  items={sections.map((s, idx) => s.id ?? `empty-${idx}`)}
                  strategy={rectSortingStrategy}
                >
                  {renderSections()}
                </SortableContext>
              </Card.Body>
            </Card>

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
