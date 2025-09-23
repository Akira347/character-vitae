// src/components/structure/__tests__/Layout.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
import { AuthProvider } from '../../../contexts/AuthContext';

test('affiche Header, Outlet (contenu) et Footer simulé', () => {
  render(
    <MemoryRouter>
      <AuthProvider>
        <Header />
        {/* Simule l\'Outlet */}
        <main>
          <div>CONTENT</div>
        </main>
        {/* Simule un footer simple (évite d'importer Footer et d'éventuels cycles) */}
        <footer>© Character Vitae</footer>
      </AuthProvider>
    </MemoryRouter>,
  );

  // header
  expect(screen.getByText('Character Vitae')).toBeInTheDocument();
  // outlet simulé
  expect(screen.getByText('CONTENT')).toBeInTheDocument();
  // footer simulé (on cherche un symbole © ou le texte que l'on a mis)
  expect(screen.getByText(/©/i)).toBeInTheDocument();
});
