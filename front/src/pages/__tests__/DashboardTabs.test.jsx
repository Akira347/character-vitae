/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { BrowserRouter } from 'react-router-dom';

const Wrapped = (ui) => <BrowserRouter>{ui}</BrowserRouter>;

test('switch entre onglets Sections et Avatar & Infos', () => {
  render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>,
  );

  // Onglet Sections actif par défaut
  const btnSections = screen.getByText('Sections');
  expect(btnSections).toHaveClass('active');

  // Un item de SectionSelector doit être visible (ex: "Identité")
  expect(screen.getByText('Identité')).toBeInTheDocument();

  // Passe à Avatar & Infos
  fireEvent.click(screen.getByText('Avatar & Infos'));

  // maintenant : on voit le bouton Contact et le niveau
  expect(screen.getByRole('button', { name: /Contact/i })).toBeInTheDocument();
  expect(screen.getByText(/Niveau \d+/i)).toBeInTheDocument();

  // Retour à Sections
  fireEvent.click(btnSections);
  expect(screen.getByText('Identité')).toBeInTheDocument();
});
