// src/tools/dragDrop.jsx
import React from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Hook custom pour initialiser les sensors et le handler
export function useDragDrop(sections, setSections) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeId, setActiveId] = React.useState(null);

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    // insertion palette → placeholder
    /*if (active.id.startsWith('type-') && over.id.startsWith('empty-')) {
      const placeIdx = parseInt(over.id.replace('empty-', ''), 10);
      const type = active.id.replace(/^type-/, '');
      const newSection = {
        id: `sec-${Date.now()}`,
        type,
        content: [],
        collapsed: false
      };
      setSections(prev => {
        const copy = [...prev];
        copy[placeIdx] = newSection;
        return copy;
      });
      return;
    }*/

    // **2) drag canvas → placeholder** (sec-… → empty-…)
    if (active.id.startsWith('sec-') && over.id.startsWith('empty-')) {
      const fromIdx = sections.findIndex((s) => s.id === active.id);
      const toIdx = parseInt(over.id.replace('empty-', ''), 10);
      setSections((prev) => {
        const copy = [...prev];
        const [moved] = copy.splice(fromIdx, 1); // extrait l’item
        // on remet une case vide à l’ancienne place
        copy.splice(fromIdx, 0, { type: 'empty' });
        // on remplace la cible
        copy[toIdx] = moved;
        return copy;
      });
      return;
    }

    // **3) reorder interne canvas** (sec-… → sec-…)
    if (active.id.startsWith('sec-') && over.id.startsWith('sec-')) {
      setSections((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        const copy = [...prev];
        const [moved] = copy.splice(oldIndex, 1);
        copy.splice(newIndex, 0, moved);
        return copy;
      });
      return;
    }

    // **4) suppression dans palette** (sec-… → palette)
    if (active.id.startsWith('sec-') && over.id === 'palette' && active.id !== 'sec-avatar') {
      setSections((prev) =>
        prev.map((s) =>
          s.id === active.id ? { id: `empty-${prev.indexOf(s)}`, type: 'empty', content: {} } : s,
        ),
      );
      return;
    }
  }

  return { sensors, handleDragEnd, activeId, setActiveId };
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
      {id !== 'sec-avatar' && (
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
      )}
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
