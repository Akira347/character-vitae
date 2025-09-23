/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
import { AuthProvider } from '../../../contexts/AuthContext';

test('affiche le logo et ouvre la modale de connexion au clic sur la plume', () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Header />
      </AuthProvider>
    </MemoryRouter>,
  );

  expect(screen.getByText('Character Vitae')).toBeInTheDocument();

  const toggleButton = screen.getByRole('button', { name: /open login/i });
  fireEvent.click(toggleButton);

  expect(screen.getByText('Se connecter')).toBeInTheDocument();
});
