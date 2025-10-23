// src/pages/Dashboard.jsx
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
  demoOnlyAvatar = false,
}) {
  const { token } = useContext(AuthContext) || {};
  const TOTAL_SLOTS = 15;

  const parseLayoutToSections = useCallback((layout) => {
    if (!layout || !Array.isArray(layout.rows)) {
      return Array.from({ length: TOTAL_SLOTS }).map((_, i) => ({
        id: `empty-${i}`,
        type: 'empty',
        content: null,
        collapsed: false, // default false
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
          collapsed: !!(cell.isCollapsed ?? cell.collapsed ?? false), // default false
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
        collapsed: false,
      });
    }

    return out;
  }, []);

  const buildSectionsFromCollection = useCallback((sectionsCollection) => {
    if (!Array.isArray(sectionsCollection) || sectionsCollection.length === 0) {
      return Array.from({ length: TOTAL_SLOTS }).map((_, i) => ({
        id: `empty-${i}`,
        type: 'empty',
        content: null,
        collapsed: false,
      }));
    }

    const copy = [...sectionsCollection].sort((a, b) => {
      const pa = typeof a.position === 'number' ? a.position : 0;
      const pb = typeof b.position === 'number' ? b.position : 0;
      if (pa !== pb) return pa - pb;
      if (a.id && b.id) return Number(a.id) - Number(b.id);
      return 0;
    });

    const out = [];
    for (let i = 0; i < copy.length && out.length < TOTAL_SLOTS; i++) {
      const s = copy[i] ?? {};
      const serverId = s.serverId ?? s.id ?? `s-${i + 1}`;
      const id = `sec-${String(serverId)}`;
      out.push({
        id,
        type: typeof s.type === 'string' ? s.type : 'empty',
        content: s.content ?? (s.type === 'empty' ? null : []),
        collapsed: !!(s.isCollapsed ?? false), // default false
        width: typeof s.width === 'number' ? s.width : s.width ? Number(s.width) : undefined,
        originalId: serverId,
        backendId: s.id ?? null,
        position: typeof s.position === 'number' ? s.position : null,
      });
    }

    while (out.length < TOTAL_SLOTS) {
      out.push({ id: `empty-${out.length}`, type: 'empty', content: null, collapsed: false });
    }

    return out;
  }, []);

  const [sections, setSectionsRaw] = useState(() => {
    if (initialCharacter?.sections && Array.isArray(initialCharacter.sections)) {
      return buildSectionsFromCollection(initialCharacter.sections);
    }
    if (initialCharacter?.layout) {
      return parseLayoutToSections(initialCharacter.layout);
    }
    return Array.from({ length: TOTAL_SLOTS }).map((_, i) => ({
      id: `empty-${i}`,
      type: 'empty',
      content: null,
      collapsed: false,
    }));
  });

  useEffect(() => {
    if (initialCharacter?.sections && Array.isArray(initialCharacter.sections)) {
      setSectionsRaw(buildSectionsFromCollection(initialCharacter.sections));
      return;
    }
    if (initialCharacter?.layout) {
      setSectionsRaw(parseLayoutToSections(initialCharacter.layout));
    }
  }, [initialCharacter, parseLayoutToSections, buildSectionsFromCollection]);

  const sectionsToLayout = useCallback((secs) => {
    const rows = [];
    for (let i = 0; i < secs.length; i += 5) {
      const chunk = secs.slice(i, i + 5);
      const row = chunk.map((s) => {
        const rawId = s.originalId ?? (s.id ? String(s.id).replace(/^sec-/, '') : null);

        // Coerce width to a number when possible. If not set, omit the width key.
        let widthVal;
        if (typeof s.width === 'number') {
          widthVal = s.width;
        } else if (s.width !== undefined && s.width !== null && s.width !== '') {
          const n = Number(s.width);
          if (!Number.isNaN(n)) widthVal = n;
        }

        const outCell = {
          id: rawId ?? `s${i + 1}`,
          type: s.type,
          // content must be null for empty slots
          content: s.content === undefined ? (s.type === 'empty' ? null : []) : s.content,
          isCollapsed: !!s.collapsed,
        };

        // attach width only if we actually have a numeric value
        if (typeof widthVal === 'number') {
          outCell.width = widthVal;
        }

        return outCell;
      });
      rows.push(row);
    }
    return { rows };
  }, []);

  const [isDirty, setIsDirty] = useState(false);
  useUnsavedWarning(isDirty, 'Modifications non sauvegardées — quitter sans sauvegarder ?');

  // wrapper that marks dirty and dispatches event
  const setSections = (updater) => {
    setIsDirty(true);
    window.dispatchEvent(new CustomEvent('dirty-changed', { detail: { isDirty: true } }));
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
      window.dispatchEvent(new CustomEvent('dirty-changed', { detail: { isDirty: true } }));
    }
  }, [avatarData, initialCharacter]);

  const [activeTab, setActiveTab] = useState('sections');

  const { sensors, handleDragEnd, activeId, setActiveId } = useDragDrop(sections, setSections, {
    onCreateSection: (newSection, placeIdx) => {
      // Ouvrir le formulaire d'édition pour la nouvelle section créée
      setEditing({ show: true, sectionId: newSection.id });
    },
    // optionnel : onOpenEditor peut être utilisé à la place
  });

  const handleAddSection = (type) => {
    if (readOnly) return;
    if (sections.some((s) => s.type === type)) return;
    const idx = sections.findIndex((s) => s.type === 'empty');
    if (idx === -1) return;
    const newId = `sec-${Date.now()}`;
    const newSection = {
      id: newId,
      type,
      content: [],
      collapsed: false,
    };
    // use setSections wrapper so dirty is tracked
    setSections((prev) => {
      const copy = [...prev];
      copy[idx] = newSection;
      return copy;
    });
    // ouvrir le formulaire d'édition immédiatement
    setEditing({ show: true, sectionId: newId });
  };

  const handleRemoveSection = (id) => {
    if (readOnly) return;
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = { id: `empty-${idx}`, type: 'empty', content: null, collapsed: false };
      return copy;
    });
  };

  const toggleCollapse = (id) => {
    setSections((secs) => secs.map((s) => (s.id === id ? { ...s, collapsed: !s.collapsed } : s)));
  };

  useEffect(() => {
    const onResized = (ev) => {
      const { id: resizedId, width: newWidth } = ev?.detail ?? {};
      if (!resizedId || typeof newWidth !== 'number') return;
      setSections((prev) =>
        prev.map((s) => (s.id === resizedId ? { ...s, width: Number(newWidth) } : s)),
      );
      // mark dirty - setSections already does that; if you call setSections directly ensure it marks dirty
    };
    window.addEventListener('section-resized', onResized);
    return () => window.removeEventListener('section-resized', onResized);
  }, []);

  // Save — Dashboard listens to header 'save-character' event
  useEffect(() => {
    const onSaveCharacter = async () => {
      if (!characterId) return;
      // build layout as before
      const layout = sectionsToLayout(sections);

      // Build a sections update array for existing backend section entities
      // so the backend can persist position/width per section entity if needed.
      const sectionsUpdates = sections
        .map((s, idx) => {
          // only sections that are backed by the server (backendId) should be sent
          if (!s.backendId) return null;
          // normalize width to number when possible
          const w = s.width === undefined || s.width === null ? null : Number(s.width);
          return {
            id: s.backendId,
            position: idx,
            // only include width if it's a valid finite number (else send null to let backend decide)
            ...(Number.isFinite(w) ? { width: w } : { width: null }),
          };
        })
        .filter(Boolean);

      // Compose body. Keep layout (fallback) and include sections updates when available.
      const body = sectionsUpdates.length > 0 ? { layout, sections: sectionsUpdates } : { layout };

      console.debug('onSaveCharacter: layout', layout);
      try {
        const headers = {
          'Content-Type': 'application/merge-patch+json',
          Accept: 'application/ld+json',
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        await fetchJson(`/apip/characters/${characterId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(body),
        });

        setIsDirty(false);
        window.dispatchEvent(new CustomEvent('dirty-changed', { detail: { isDirty: false } }));
        window.dispatchEvent(
          new CustomEvent('character-updated', { detail: { id: String(characterId) } }),
        );
        window.dispatchEvent(
          new CustomEvent('notify', {
            detail: { message: 'Disposition sauvegardée', variant: 'success', timeout: 2000 },
          }),
        );
      } catch (err) {
        console.error('save-character failed', err);
        window.dispatchEvent(
          new CustomEvent('notify', {
            detail: { message: 'Erreur sauvegarde', variant: 'danger', timeout: 4000 },
          }),
        );
      }
    };

    window.addEventListener('save-character', onSaveCharacter);
    return () => window.removeEventListener('save-character', onSaveCharacter);
  }, [characterId, sections, sectionsToLayout, token]);

  const reloadCharacterFromServer = useCallback(
    async (idToLoad) => {
      if (!idToLoad) return;
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const json = await fetchJson(`/apip/characters/${idToLoad}`, { method: 'GET', headers });
        const data = json?.data ?? json;
        if (!data) return;
        if (Array.isArray(data.sections) && data.sections.length > 0) {
          setSectionsRaw(buildSectionsFromCollection(data.sections));
        } else if (data.layout) {
          setSectionsRaw(parseLayoutToSections(data.layout));
        }
        if (data.avatar) {
          setAvatarData(data.avatar);
        }
        setIsDirty(false);
        window.dispatchEvent(new CustomEvent('dirty-changed', { detail: { isDirty: false } }));
      } catch (err) {
        console.error('reloadCharacterFromServer error', err);
      }
    },
    [token, buildSectionsFromCollection, parseLayoutToSections],
  );

  useEffect(() => {
    const onCharacterUpdated = (ev) => {
      const id = ev?.detail?.id ?? null;
      if (!id) return;
      if (String(id) === String(characterId)) {
        reloadCharacterFromServer(id);
      }
    };
    const onCharacterLayoutChanged = (ev) => {
      const id = ev?.detail?.id ?? null;
      if (!id) return;
      if (String(id) === String(characterId)) {
        reloadCharacterFromServer(id);
      }
    };
    window.addEventListener('character-updated', onCharacterUpdated);
    window.addEventListener('character-layout-changed', onCharacterLayoutChanged);
    return () => {
      window.removeEventListener('character-updated', onCharacterUpdated);
      window.removeEventListener('character-layout-changed', onCharacterLayoutChanged);
    };
  }, [characterId, reloadCharacterFromServer]);

  const [editing, setEditing] = useState({ show: false, sectionId: null });

  const renderSections = () =>
    sections.map((sec, idx) => (
      <SectionContainer
        key={sec.id ?? `empty-${idx}`}
        id={sec.id ?? `empty-${idx}`}
        type={sec.type}
        width={
          typeof sec.width === 'number' ? sec.width : sec.width ? Number(sec.width) : undefined
        }
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

  if (readOnly) {
    return (
      <div className="dashboard-readonly">
        <Row className="gy-4">
          <Col xs={12} md={3} lg={2}>
            <div className="section-sidebar">
              {demoOnlyAvatar ? (
                <div style={{ padding: 10 }}>
                  <AvatarInfoPanel data={avatarData} onEditAvatar={() => {}} />
                </div>
              ) : (
                <>
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
                </>
              )}
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => {
        console.debug('DndContext onDragStart', {
          activeId: active?.id,
          sectionsSnapshot: sections.map((s, i) => ({ idx: i, id: s.id, type: s.type })),
        });
        setActiveId(active.id);
      }}
      onDragEnd={(event) => {
        // no special-case for type-... here, delegate to hook
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
                setIsDirty(true);
                window.dispatchEvent(
                  new CustomEvent('dirty-changed', { detail: { isDirty: true } }),
                );
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
