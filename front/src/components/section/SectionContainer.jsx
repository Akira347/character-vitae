// src/components/section/SectionContainer.jsx
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export default function SectionContainer({
  id,
  type,
  width,
  collapsed,
  onToggle,
  onEdit,
  onDelete,
  children,
  readOnly,
}) {
  // Hooks doivent être appelés TOUJOURS — mais on n'appliquera pas les listeners en readOnly
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
    if (readOnly) return;
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

    containerRef.current.style.minWidth = `${clamped}px`;
    containerRef.current.style.maxWidth = `${clamped}px`;
  };

  const onMouseUp = () => {
    if (readOnly) return;
    resizing.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  const widthStyle =
    typeof width === 'number' ? { minWidth: `${width}px`, maxWidth: `${width}px` } : {};

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
        ...widthStyle,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {/* poignées de resize — masquées en readOnly */}
      {!readOnly && (
        <div className="section-handle left" onMouseDown={(e) => onMouseDown('left', e)} />
      )}
      {!readOnly && (
        <div className="section-handle right" onMouseDown={(e) => onMouseDown('right', e)} />
      )}

      {/* header drag handle */}
      {!readOnly ? (
        <span className="drag-handle" {...listeners} {...attributes} title="Glisser pour déplacer">
          ⠿
        </span>
      ) : null}

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
          {/* drag handle: n'appliquer listeners/attributes que si pas readOnly */}
          <span
            className="drag-handle"
            title={readOnly ? '' : 'Glisser pour déplacer'}
            {...(readOnly ? {} : { ...listeners })}
            {...(readOnly ? {} : { ...attributes })}
            style={{ cursor: readOnly ? 'default' : undefined }}
          >
            {!readOnly ? '⠿' : null}
          </span>

          <h5>{type}</h5>
          <div className="controls">
            {onEdit && !readOnly && (
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
            {onDelete && !readOnly && (
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
  width: PropTypes.number,
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  children: PropTypes.node,
  readOnly: PropTypes.bool,
};

SectionContainer.defaultProps = {
  width: undefined,
  collapsed: false,
  onEdit: null,
  onDelete: null,
  children: null,
  readOnly: false,
};
