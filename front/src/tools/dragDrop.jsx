// src/tools/dragDrop.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';

/**
 * Helpers exportés (module scope) — permettent aussi d'écrire des tests unitaires sur eux.
 */

// crée un placeholder empty pour l'index donné
export function makeEmptyPlaceholder(idx) {
  return { id: `empty-${idx}`, type: 'empty', content: null, collapsed: false };
}

// génère un id unique pour une nouvelle section (timestamp-based)
export function createNewSectionId() {
  return `sec-${Date.now()}`;
}

/**
 * Normalise l'overId (qui peut arriver sous plusieurs formes).
 * Retourne un objet { kind: 'empty'|'sec'|'palette'|'unknown', index?: number, id?: string }
 *
 * IMPORTANT: on prend `sections` en paramètre pour vérifier si une cible correspond
 * à une case réelle et si elle est de type 'empty'.
 */
export function parseOverId(raw, sections = []) {
  if (!raw || typeof raw !== 'string') return { kind: 'unknown' };

  // cas direct palette
  if (raw === 'palette') return { kind: 'palette', id: 'palette' };

  // normalized : retire prefixe 'sec-' si présent (différents composants l'ajoutent)
  let normalized = raw;
  if (normalized.startsWith('sec-')) normalized = normalized.slice(4);

  // direct empty-N pattern
  if (normalized.startsWith('empty-')) {
    const idx = parseInt(normalized.replace(/^empty-/, ''), 10);
    if (!Number.isNaN(idx)) return { kind: 'empty', index: idx, id: `empty-${idx}` };
    return { kind: 'empty', id: normalized };
  }

  // cherche heuristiquement un index correspondant dans `sections`
  const findIndexFor = (value) => {
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (!s) continue;
      // exact match on id (sec-...) or id without prefix
      if (String(s.id) === `sec-${value}` || String(s.id) === value) return i;
      // match originalId (backend e.g. 's6')
      if (s.originalId && String(s.originalId) === value) return i;
      // originalId maybe numeric or with s prefix
      if (s.originalId && String(s.originalId) === `s${value}`) return i;
      // numeric suffix match (strip sec-)
      const suffix = String(s.id).replace(/^sec-/, '');
      if (suffix === value) return i;
    }
    return -1;
  };

  let idx = findIndexFor(normalized);

  // si normalized est uniquement numérique, retenter (timestamps / server ids)
  if (idx === -1 && /^\d+$/.test(normalized)) {
    idx = findIndexFor(normalized);
  }

  if (idx !== -1) {
    const target = sections[idx];
    if (target && target.type === 'empty') {
      return { kind: 'empty', index: idx, id: `empty-${idx}` };
    }
    return { kind: 'sec', id: target?.id ?? `sec-${normalized}` };
  }

  // fallback heuristics
  if (normalized.startsWith('s')) {
    return { kind: 'sec', id: `sec-${normalized}` };
  }
  if (/^\d+$/.test(normalized)) {
    return { kind: 'sec', id: `sec-${normalized}` };
  }

  return { kind: 'unknown', id: normalized };
}

/**
 * useDragDrop(sections, setSections, opts)
 *
 * opts:
 *  - onCreateSection(newSection, placeIdx)
 *  - onOpenEditor(sectionId)
 */
export function useDragDrop(sections, setSections, opts = {}) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeId, setActiveId] = React.useState(null);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!active || !active.id) {
      setActiveId(null);
      return;
    }

    const aId = String(active.id);
    const rawOver = over && over.id ? String(over.id) : null;
    const parsedOver = parseOverId(rawOver, sections);

    console.debug('handleDragEnd: start', {
      activeId: aId,
      rawOver,
      parsedOver,
      sectionsBefore: sections.map((s, i) => ({ idx: i, id: s.id, type: s.type })),
    });

    // PALETTE -> CANVAS (type-... -> empty)
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
        // ensure predictable length
        while (copy.length < sections.length) copy.push(makeEmptyPlaceholder(copy.length));
        copy[placeIdx] = newSection;
        console.debug(
          'handleDragEnd: sectionsAfter (palette->canvas)',
          copy.map((s, i) => ({ idx: i, id: s.id, type: s.type })),
        );
        return copy;
      });

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

      setActiveId(newSection.id);
      console.debug('handleDragEnd: finished palette->canvas', { newId: newSection.id });
      return;
    }

    // MOVE canvas -> empty (sec-... -> empty-...)
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
        copy.splice(fromIdx, 0, makeEmptyPlaceholder(fromIdx));
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

    // REORDER canvas -> canvas (sec-... -> sec-...)
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

    // DELETE to palette (sec-... -> palette)
    if (aId.startsWith('sec-') && parsedOver.kind === 'palette' && aId !== 'sec-avatar') {
      console.debug('handleDragEnd: DELETE to palette', { aId });
      setSections((prev) => prev.map((s, i) => (s.id === aId ? makeEmptyPlaceholder(i) : s)));
      setActiveId(null);
      return;
    }

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
