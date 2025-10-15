import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

/**
 * SectionContainer
 *
 * Props :
 * - id, type, collapsed, onToggle, onEdit, onDelete
 * - readOnly: si true, désactive drag&drop & edition (mais conserve collapse)
 */
export default function SectionContainer({
  id,
  type,
  collapsed = false,
  onToggle,
  onEdit = null,
  onDelete = null,
  children = null,
  readOnly = false,
}) {
  const containerRef = useRef(null);

  // Si on n'est pas en lecture seule, hook DnD (sortable + droppable)
  let sortable = null;
  let dropInfo = null;
  try {
    if (!readOnly) {
      sortable = useSortable({ id });
      dropInfo = useDroppable({ id });
    }
  } catch (e) {
    // silence : si DnD n'est pas disponible (render server / readOnly) on ignore
    sortable = null;
    dropInfo = null;
  }

  const attributes = sortable?.attributes ?? {};
  const listeners = sortable?.listeners ?? {};
  const setNodeRefSortable = sortable?.setNodeRef ?? (() => {});
  const transform = sortable?.transform ?? null;
  const transition = sortable?.transition ?? undefined;
  const setDropRef = dropInfo?.setNodeRef ?? (() => {});
  const isOver = !!dropInfo?.isOver;

  // rootRef combiné
  const rootRef = (node) => {
    containerRef.current = node;
    // attach to sortable/droppable only if present
    if (setNodeRefSortable) setNodeRefSortable(node);
    if (setDropRef) setDropRef(node);
  };

  const onMouseDown = (side, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;
    // resize handled via DOM, idem qu'avant
    const startX = e.clientX;
    const startW = containerRef.current.offsetWidth;
    function onMouseMove(ev) {
      const delta = ev.clientX - startX;
      const rawW = side === 'right' ? startW + delta : startW - delta;
      const minW = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--section-min'),
        10,
      );
      const maxW = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--section-max'),
        10,
      );
      const clamped = Math.min(maxW, Math.max(minW, rawW));
      containerRef.current.style.minWidth = `${clamped}px`;
      containerRef.current.style.maxWidth = `${clamped}px`;
    }
    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const isEmpty = type === 'empty';

  return (
    <div
      ref={rootRef}
      className={[
        'section-container',
        collapsed && 'collapsed',
        isEmpty && 'section-placeholder',
        isEmpty && 'empty',
        isOver && 'droppable-over',
        readOnly && 'read-only',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition,
      }}
    >
      {/* poignées de resize (toujours disponibles en lecture seule) */}
      <div className="section-handle left" onMouseDown={(e) => onMouseDown('left', e)} />
      <div className="section-handle right" onMouseDown={(e) => onMouseDown('right', e)} />

      <div
        className="section-top"
        onClick={() => onToggle && onToggle(id)}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div className="section-parchment">
        <header
          className="section-header"
          onClick={() => onToggle && onToggle(id)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {!readOnly && (
            <span
              className="drag-handle"
              {...listeners}
              {...attributes}
              title="Glisser pour déplacer"
            >
              ⠿
            </span>
          )}

          <h5>{type}</h5>
          <div className="controls">
            {!readOnly && onEdit && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(id);
                }}
                aria-label="Modifier la section"
              >
                ✎
              </button>
            )}
            {!readOnly && onDelete && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                }}
                aria-label="Supprimer la section"
              >
                ✕
              </button>
            )}
          </div>
        </header>
        <div className="section-body" style={{ overflow: 'visible' }}>
          {children}
        </div>
      </div>
      <div
        className="section-bottom"
        onClick={() => onToggle && onToggle(id)}
        onPointerDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}

SectionContainer.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  children: PropTypes.node,
  readOnly: PropTypes.bool,
};

SectionContainer.defaultProps = {
  collapsed: false,
  onToggle: null,
  onEdit: null,
  onDelete: null,
  children: null,
  readOnly: false,
};
