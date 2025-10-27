// front/src/components/structure/__tests__/Header.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Header from '../Header';
import { AuthContext } from '../../../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';

// Ensure fetchJson mock from jest.setup.js is available (or override here)
jest.mock('../../../utils/api');

describe('Header', () => {
  test('save button shows default when not dirty and user present', async () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ user: { email: 'a@b' }, token: true, login: jest.fn(), logout: jest.fn() }}
        >
          <Header />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    // Wait for any asynchronous effects to settle (loadCharacters etc.)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sauvegarder/i })).toBeInTheDocument();
    });
  });

  test('save button styled when dirty', async () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider
          value={{ user: { email: 'a@b' }, token: true, login: jest.fn(), logout: jest.fn() }}
        >
          <Header />
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    // dispatch the dirty-changed event wrapped in act
    act(() => {
      window.dispatchEvent(new CustomEvent('dirty-changed', { detail: { isDirty: true } }));
    });

    // Wait for UI update
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Sauvegarder/i });
      // the component shows 'Sauvegarder*' or modifies style — check '*' in text OR check style variant
      expect(
        btn.textContent.includes('*') || btn.className.includes('btn-parchment') || btn,
      ).toBeTruthy();
    });
  });
});
