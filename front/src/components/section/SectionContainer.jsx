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

  const parseWidth = (w) => {
    if (typeof w === 'number') return w;
    if (typeof w === 'string') {
      const n = Number(w);
      if (!Number.isNaN(n)) return n;
    }
    return undefined;
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

    // Apply inline width to give immediate visual feedback
    containerRef.current.style.minWidth = `${clamped}px`;
    containerRef.current.style.maxWidth = `${clamped}px`;
  };

  const onMouseUp = () => {
    if (readOnly) return;
    if (!containerRef.current) {
      resizing.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      return;
    }

    // compute final numeric width (px)
    const finalWidth = containerRef.current.offsetWidth;
    // emit global event so parent (Dashboard) can update its model
    try {
      window.dispatchEvent(
        new CustomEvent('section-resized', {
          detail: { id, width: Number(finalWidth) },
        }),
      );
    } catch (err) {
      // Defensive: don't break UI if dispatch fails
      // eslint-disable-next-line no-console
      console.error('section-resized dispatch failed', err);
    }

    resizing.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  // compute inline style from prop width (accept number or numeric string)
  const wNum = parseWidth(width);
  const widthStyle =
    typeof wNum === 'number' ? { minWidth: `${wNum}px`, maxWidth: `${wNum}px` } : {};

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
  // accept number or numeric string for backward compatibility
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
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
