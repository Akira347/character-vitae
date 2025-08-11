// src/components/section/SectionContainer.jsx
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

/**
 * Conteneur d’une section du CV (drag, resize, collapse, edit, delete).
 *
 * @param {object} props              Props du composant (destructurées ci-dessous)
 * @param {string}   props.id         Identifiant unique de la section
 * @param {string}   props.type       Type de la section (ou "empty")
 * @param {boolean}  [props.collapsed] Si true, la section est repliée
 * @param {Function} props.onToggle   Fonction appelée avec (id) pour basculer collapsed
 * @param {Function} [props.onEdit]   Fonction appelée avec (id) sur “Modifier”
 * @param {Function} [props.onDelete] Fonction appelée avec (id) sur “Supprimer”
 * @param {React.ReactNode} [props.children] Contenu interne de la section
 * @returns {JSX.Element}             Le rendu du composant SectionContainer
 */
export default function SectionContainer({
  id,
  type,
  collapsed,
  onToggle,
  onEdit,
  onDelete,
  children,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const containerRef = useRef(null);
  const resizing = useRef(null);
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id });
  const isEmpty = type === 'empty';
  const rootRef = (node) => {
    setNodeRef(node);
    setDropRef(node);
    containerRef.current = node;
  };

  const onMouseDown = (side, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!containerRef.current) return;
    resizing.current = {
      side,
      startX: e.clientX,
      startW: containerRef.current.offsetWidth,
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!resizing.current || !containerRef.current) return;
    const { side, startX, startW } = resizing.current;
    const delta = e.clientX - startX;
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

    // Au lieu de setWidth(clamped) :
    containerRef.current.style.minWidth = `${clamped}px`;
    containerRef.current.style.maxWidth = `${clamped}px`;
  };

  const onMouseUp = () => {
    resizing.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={rootRef}
      className={[
        'section-container',
        collapsed && 'collapsed',
        isEmpty && 'section-placeholder',
        isEmpty && 'empty',
        isOver && 'droppable-over',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {/* poignées de resize */}
      <div className="section-handle left" onMouseDown={(e) => onMouseDown('left', e)} />
      <div className="section-handle right" onMouseDown={(e) => onMouseDown('right', e)} />

      <div
        className="section-top"
        onClick={() => onToggle(id)}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div className="section-parchment">
        <header
          className="section-header"
          onClick={() => onToggle(id)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span
            className="drag-handle"
            {...listeners}
            {...attributes}
            title="Glisser pour déplacer"
          >
            ⠿
          </span>

          <h5>{type}</h5>
          <div className="controls">
            {onEdit && (
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
            {onDelete && (
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
        onClick={() => onToggle(id)}
        onPointerDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}

SectionContainer.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  children: PropTypes.node,
};

SectionContainer.defaultProps = {
  collapsed: false,
  onEdit: null,
  onDelete: null,
  children: null,
};
