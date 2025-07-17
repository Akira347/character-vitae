// src/tools/dragDrop.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Hook custom pour initialiser les sensors et le handler
export function useDragDrop(sections, setSections) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event) {
    const { active, over } = event;
    // si c'est un type-XXX, on ajoute une nouvelle section
    if (active.id.startsWith('type-') && over && !over.id.startsWith('type-')) {
      const type = active.id.replace(/^type-/, '');
      const newSection = { id: Date.now().toString(), type, content: [] };
      setSections((prev) => {
        const idx = prev.findIndex((s) => s.id === over.id);
        return [...prev.slice(0, idx + 1), newSection, ...prev.slice(idx + 1)];
      });
      return;
    }
    // sinon, c'est un reorder classique
    if (over && active.id !== over.id) {
      setSections((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  return { sensors, handleDragEnd };
}

// Composant sortable pour chaque section
export function SortableSection({ id, children, onSectionClick, onDeleteClick }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: '48%',
    margin: '1%',
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* Bouton d’édition */}
      <button
        type="button"
        onPointerDown={(e) => {
          // on empêche ce pointeur d'initier un drag
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          // on peut toujours cliquer dessus
          e.stopPropagation();
          onSectionClick(id);
        }}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '2px 6px',
          cursor: 'pointer',
          zIndex: 10,
        }}
        aria-label="Éditer la section"
      >
        ✎
      </button>
      {children}
      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDeleteClick(id);
        }}
        style={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="Supprimer la section"
      >
        ✕
      </button>
    </div>
  );
}

SortableSection.propTypes = {
  id: PropTypes.string.isRequired,
  onSectionClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  children: PropTypes.node,
};

SortableSection.defaultProps = {
  children: null,
};

// Wrapper pour englober la zone drag&drop
export function DragDropContainer({ sections, setSections, children }) {
  const { sensors, handleDragEnd } = useDragDrop(sections, setSections);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

DragDropContainer.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      type: PropTypes.string,
      content: PropTypes.any,
    }),
  ).isRequired,
  setSections: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
