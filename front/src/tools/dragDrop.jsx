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
export function SortableSection({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: '48%',
    margin: '1%',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

SortableSection.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  children: PropTypes.node.isRequired,
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
    })
  ).isRequired,
  setSections: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
