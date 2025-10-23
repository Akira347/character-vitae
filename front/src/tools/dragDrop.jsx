import React from 'react';
import PropTypes from 'prop-types';
import { PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';

/**
 * useDragDrop(sections, setSections, opts)
 *
 * opts:
 *  - onCreateSection(newSection, placeIdx)  // appelé après palette->canvas
 *  - onOpenEditor(sectionId)                // appelé quand on veut ouvrir l'éditeur
 */
export function useDragDrop(sections, setSections, opts = {}) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeId, setActiveId] = React.useState(null);

  // helpers
  const makeEmptyPlaceholder = (idx) => ({
    id: `empty-${idx}`,
    type: 'empty',
    content: null,
    collapsed: false,
  });

  const createNewSectionId = () => `sec-${Date.now()}`;

  /**
   * Normalise l'overId (qui peut arriver sous plusieurs formes).
   * Retourne un objet { kind: 'empty'|'sec'|'palette'|'unknown', index?: number, id?: string }
   */
  /**
   * Normalise l'overId (qui peut arriver sous plusieurs formes).
   * IMPORTANT : on regarde le tableau `sections` pour savoir si une `sec-...`
   * correspond à une case réelle qui est de type 'empty'.
   *
   * Retourne { kind: 'empty'|'sec'|'palette'|'unknown', index?: number, id?: string }
   */
  const parseOverId = (raw) => {
    if (!raw || typeof raw !== 'string') return { kind: 'unknown' };

    // raw peut être 'palette', 'empty-5', 'sec-empty-7', 'sec-s6', 's6', 'sec-1761211191262', etc.
    let normalized = raw;

    // si c'est le node droppable palette
    if (normalized === 'palette') return { kind: 'palette', id: 'palette' };

    // retire préfixe 'sec-' si présent (différents composants ajoutent ce préfixe)
    if (normalized.startsWith('sec-')) {
      normalized = normalized.slice(4);
    }

    // cas direct empty-<n>
    if (normalized.startsWith('empty-')) {
      const idx = parseInt(normalized.replace(/^empty-/, ''), 10);
      if (!Number.isNaN(idx)) return { kind: 'empty', index: idx, id: `empty-${idx}` };
      return { kind: 'empty', id: normalized };
    }

    // si normalized ressemble à 's6' / 's10' / 's123' -> on tentera de trouver la section correspondante
    // Construisons une logique robuste : cherchons dans `sections` un index qui correspond
    // soit à un id exact (`sec-...`), soit à originalId (ex: 's6'), soit à suffixe numérique.
    // On renvoie 'empty' si la section trouvée a type === 'empty'.
    // NB: `sections` provient du scope du hook.

    // helper: try to find index by various heuristics
    const findIndexFor = (value) => {
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        if (!s) continue;
        // exact match on id (sec-...)
        if (String(s.id) === `sec-${value}` || String(s.id) === value) return i;
        // match originalId (ex: 's6' from backend layout)
        if (s.originalId && String(s.originalId) === value) return i;
        // sometimes originalId stored without 's' prefix (numeric)
        if (s.originalId && String(s.originalId) === `s${value}`) return i;
        // numeric suffix match
        const suffix = String(s.id).replace(/^sec-/, '');
        if (suffix === value) return i;
      }
      return -1;
    };

    // try direct find
    let idx = findIndexFor(normalized);

    // if normalized is just a number (timestamp or numeric id), also try that
    if (idx === -1 && /^\d+$/.test(normalized)) {
      idx = findIndexFor(normalized);
    }

    if (idx !== -1) {
      const target = sections[idx];
      if (target && target.type === 'empty') {
        return { kind: 'empty', index: idx, id: `empty-${idx}` };
      }
      // it's a real section slot (occupied or reserved) -> normalize to sec with canonical id
      return { kind: 'sec', id: target?.id ?? `sec-${normalized}` };
    }

    // fallback: if string starts with 's' treat as sec
    if (normalized.startsWith('s')) {
      return { kind: 'sec', id: `sec-${normalized}` };
    }

    // numeric fallback -> sec
    if (/^\d+$/.test(normalized)) {
      return { kind: 'sec', id: `sec-${normalized}` };
    }

    // unknown fallback
    return { kind: 'unknown', id: normalized };
  };

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!active || !active.id) {
      // nothing active
      setActiveId(null);
      return;
    }

    const aId = String(active.id);
    const rawOver = over && over.id ? String(over.id) : null;
    const parsedOver = parseOverId(rawOver);

    // Debug helpful logs (remove or lower level in prod)
    console.debug('handleDragEnd: start', {
      activeId: aId,
      rawOver,
      parsedOver,
      sectionsBefore: sections.map((s, i) => ({ idx: i, id: s.id, type: s.type })),
    });

    // --- PALETTE -> CANVAS ---
    // active from palette are like "type-Identité" (we check startsWith 'type-')
    if (aId.startsWith('type-') && parsedOver.kind === 'empty') {
      const placeIdx = Math.max(0, Math.min(parsedOver.index ?? 0, sections.length - 1));
      const typeName = aId.replace(/^type-/, '');
      const newId = createNewSectionId();
      const newSection = {
        id: newId,
        type: typeName,
        content: [],
        collapsed: false,
      };

      console.debug('handleDragEnd: PALETTE -> CANVAS create', { newSection, placeIdx });

      setSections((prev) => {
        const copy = [...prev];
        // ensure copy has placeholders with predictable ids
        while (copy.length < sections.length) copy.push(makeEmptyPlaceholder(copy.length));
        copy[placeIdx] = newSection;
        // return copy (we log it)
        console.debug(
          'handleDragEnd: sectionsAfter (palette->canvas)',
          copy.map((s, i) => ({ idx: i, id: s.id, type: s.type })),
        );
        return copy;
      });

      // notify caller (Dashboard) so it can open editor, persist, etc.
      if (typeof opts.onCreateSection === 'function') {
        try {
          opts.onCreateSection(newSection, placeIdx);
        } catch (e) {
          console.error('useDragDrop.onCreateSection threw', e);
        }
      } else if (typeof opts.onOpenEditor === 'function') {
        try {
          opts.onOpenEditor(newSection.id);
        } catch (e) {
          console.error('useDragDrop.onOpenEditor threw', e);
        }
      }

      // set active to the new created id briefly (useful for DragOverlay)
      setActiveId(newSection.id);
      console.debug('handleDragEnd: finished palette->canvas', { newId: newSection.id });
      return;
    }

    // --- MOVE canvas -> empty (sec-... -> empty-...) ---
    if (aId.startsWith('sec-') && parsedOver.kind === 'empty') {
      const fromIdx = sections.findIndex((s) => s.id === aId);
      const toIdx = Math.max(0, Math.min(parsedOver.index ?? 0, sections.length - 1));
      console.debug('handleDragEnd: MOVE canvas->empty', { aId, fromIdx, toIdx });

      setSections((prev) => {
        const copy = [...prev];
        if (fromIdx === -1) {
          console.debug('handleDragEnd: fromIdx not found, aborting move', { aId });
          return prev;
        }
        const [moved] = copy.splice(fromIdx, 1);
        // put placeholder back where it was
        copy.splice(fromIdx, 0, makeEmptyPlaceholder(fromIdx));
        // ensure index bounds
        copy[toIdx] = moved;
        console.debug(
          'handleDragEnd: sectionsAfter (canvas->empty)',
          copy.map((s, i) => ({ idx: i, id: s.id, type: s.type })),
        );
        return copy;
      });

      setActiveId(null);
      return;
    }

    // --- REORDER canvas -> canvas (sec-... -> sec-...) ---
    if (aId.startsWith('sec-') && parsedOver.kind === 'sec') {
      const oIdNormalized = parsedOver.id;
      console.debug('handleDragEnd: REORDER canvas->canvas', { aId, oIdNormalized });
      setSections((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === aId);
        const newIndex = prev.findIndex((s) => s.id === oIdNormalized);
        if (oldIndex === -1 || newIndex === -1) {
          console.debug('handleDragEnd: reorder indices not found', { oldIndex, newIndex });
          return prev;
        }
        const copy = [...prev];
        const [moved] = copy.splice(oldIndex, 1);
        copy.splice(newIndex, 0, moved);
        console.debug(
          'handleDragEnd: sectionsAfter (reorder)',
          copy.map((s, i) => ({ idx: i, id: s.id, type: s.type })),
        );
        return copy;
      });
      setActiveId(null);
      return;
    }

    // --- DELETE to palette (sec-... -> palette) ---
    if (aId.startsWith('sec-') && parsedOver.kind === 'palette' && aId !== 'sec-avatar') {
      console.debug('handleDragEnd: DELETE to palette', { aId });
      setSections((prev) => prev.map((s, i) => (s.id === aId ? makeEmptyPlaceholder(i) : s)));
      setActiveId(null);
      return;
    }

    // fallback
    console.debug('handleDragEnd: unknown case', { aId, parsedOver });
    setActiveId(null);
  }

  return { sensors, handleDragEnd, activeId, setActiveId };
}

/**
 * Zone droppable générique (utilisée pour la palette / canvas slots).
 */
export function DroppableZone({ id, children, style, className }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      data-id={id}
      className={isOver ? `${className || ''} droppable-over` : className}
      style={style}
    >
      {children}
    </div>
  );
}

DroppableZone.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  style: PropTypes.object,
  className: PropTypes.string,
};

DroppableZone.defaultProps = {
  children: null,
  style: {},
};
