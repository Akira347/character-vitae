// src/components/section/SectionContainer.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import '../../styles/Dashboard.css';

export default function SectionContainer({
  id,
  type,
  collapsed,
  onToggle,
  onEdit,
  onDelete,
  isDragging,
  children,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`section-container ${collapsed ? 'collapsed' : ''}`}
    >
      {/* Quand on clique sur la partie top ou le header ou le bottom, on toggle */}
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
          {/* poignée de drag */}
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
        <div className="section-body">{children}</div>
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
  isDragging: PropTypes.bool,
  children: PropTypes.node,
};

SectionContainer.defaultProps = {
  collapsed: false,
  onEdit: null,
  onDelete: null,
  isDragging: false,
  children: null,
};
