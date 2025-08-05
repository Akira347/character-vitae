/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';

test('affiche le logo et ouvre la modale de connexion au clic sur la plume', () => {
  render(<Header />, { wrapper: MemoryRouter });

  // 1) Le logo
  expect(screen.getByText('Character Vitae')).toBeInTheDocument();

  // 2) La plume est un Nav.Link, on la récupère comme un bouton
  const toggleButton = screen.getByRole('button');
  fireEvent.click(toggleButton);

  // 3) La modale doit s'ouvrir : on y trouve le titre "Se connecter"
  expect(screen.getByText('Se connecter')).toBeInTheDocument();
});
