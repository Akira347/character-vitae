// src/tools/dragDrop.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';

/**
 * Hook de drag & drop pour le canvas des sections.
 *
 * Fournit les sensors pour dnd-kit, l'identifiant actif et le handler
 * de fin de drag (réordonnancement / création / suppression).
 *
 * @param {Array.<Object>} sections - tableau courant des sections (chaque section est un objet)
 * @param {Function} setSections - setter React pour mettre à jour `sections`
 * @returns {{sensors: Object, handleDragEnd: Function, activeId: (string|null), setActiveId: Function}}  Les functions et élements de drag&drop
 */
export function useDragDrop(sections, setSections) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeId, setActiveId] = React.useState(null);

  /**
   * Handler appelé par dnd-kit à la fin du drag.
   *
   * Gère trois cas :
   *  - canvas -> placeholder (sec-… -> empty-…) : on déplace l'item et on remet un placeholder
   *  - reorder interne canvas (sec-… -> sec-…) : on réordonne
   *  - suppression vers palette (sec-… -> palette) : on remplace par un placeholder
   *
   * @param {Object} event - objet d'événement fourni par dnd-kit
   * @param {Object} event.active - item actif (ex: { id: 'sec-123' } ou 'type-Identité' depuis la palette)
   * @param {Object|null} event.over - zone d'arrivée (peut être null)
   * @returns {void}
   */
  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    // **1) drag canvas → placeholder** (sec-… → empty-…)
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

    // **2) reorder interne canvas** (sec-… → sec-…)
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

    // **3) suppression dans palette** (sec-… → palette)
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

/**
 * Zone droppable générique (utilisée pour la palette / canvas slots).
 *
 * @param {object} props                              Props du composant (destructurées ci-dessous)
 * @param {string} props.id                           Identifiant unique de la zone droppable
 * @param {Element|React.ReactNode} [props.children]  Contenu à afficher dans la zone
 * @param {Object} [props.style]                      Styles inline optionnels
 * @param {string} [props.className]                  Classe CSS optionnelle
 * @returns {Element}                                 Élément DOM racine de la zone
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
