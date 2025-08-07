/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SectionContainer from '../SectionContainer';

test('toggle collapse et boutons Éditer/Supprimer', () => {
  const handleToggle = jest.fn();
  const handleEdit = jest.fn();
  const handleDelete = jest.fn();

  render(
    <SectionContainer
      id="sec-1"
      type="Test"
      collapsed={false}
      onToggle={handleToggle}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isDragging={false}
    >
      <div data-testid="child">Contenu</div>
    </SectionContainer>,
  );

  // Toggle
  fireEvent.click(screen.getByText('Test'));
  expect(handleToggle).toHaveBeenCalledWith('sec-1');

  // Éditer
  fireEvent.click(screen.getByLabelText('Modifier la section'));
  expect(handleEdit).toHaveBeenCalledWith('sec-1');

  // Supprimer
  fireEvent.click(screen.getByLabelText('Supprimer la section'));
  expect(handleDelete).toHaveBeenCalledWith('sec-1');
});
