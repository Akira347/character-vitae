/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SectionSelector from '../SectionSelector';
import { SECTION_TYPES } from '../../../constants/sectionTypes';

test('<SectionSelector> rend tous les types et appelle onAddSection', () => {
  const handleAdd = jest.fn();
  render(<SectionSelector availableTypes={SECTION_TYPES} onAddSection={handleAdd} />);

  SECTION_TYPES.forEach((type) => {
    // Vérifie la présence du label
    expect(screen.getByText(type)).toBeInTheDocument();

    // Récupère le bouton via aria-label
    const btn = screen.getByLabelText(`Ajouter la section ${type}`);
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleAdd).toHaveBeenCalledWith(type);
  });

  expect(handleAdd).toHaveBeenCalledTimes(SECTION_TYPES.length);
});
