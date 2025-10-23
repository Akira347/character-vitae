// src/components/structure/__tests__/HeaderLogin.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Header from '../Header';
import { AuthProvider } from '../../../contexts/AuthContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

test('successful login sets token and redirects to /dashboard', async () => {
  // mock /api/login_check then /api/me
  global.fetch
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'abc123' }),
      text: async () => JSON.stringify({ token: 'abc123' }),
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, email: 'u@e.com', fullName: 'User' }),
      text: async () => JSON.stringify({ id: 1, email: 'u@e.com' }),
    });

  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<div />} />
          {/* simulate the dashboard route used by Header on successful login */}
          <Route path="/dashboard" element={<div data-testid="home">HOME</div>} />
          {/* catch-all to avoid "No routes matched location" warnings */}
          <Route path="*" element={<div />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

  // open login modal (role=button)
  const plume = screen.getByRole('button', { name: /open login/i });
  fireEvent.click(plume);

  // fill form
  fireEvent.change(screen.getByLabelText(/Adresse e-mail/i), { target: { value: 'u@e.com' } });
  fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: 'password' } });

  // submit
  fireEvent.click(screen.getByRole('button', { name: /connexion/i }));

  // wait for redirect to /dashboard
  await waitFor(() => expect(screen.getByTestId('home')).toBeInTheDocument(), { timeout: 1500 });

  // token stored
  expect(localStorage.getItem('cv_token')).toBe('abc123');
});

test('login failure shows error message', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: 401,
    json: async () => ({ message: 'Bad credentials' }),
    text: async () => JSON.stringify({ message: 'Bad credentials' }),
  });

  render(
    <MemoryRouter>
      <AuthProvider>
        <Header />
      </AuthProvider>
    </MemoryRouter>,
  );

  fireEvent.click(screen.getByRole('button', { name: /open login/i }));
  fireEvent.change(screen.getByLabelText(/Adresse e-mail/i), { target: { value: 'wrong@e.com' } });
  fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: 'bad' } });
  fireEvent.click(screen.getByRole('button', { name: /connexion/i }));

  await waitFor(() =>
    expect(
      screen.getByText(/E-mail ou mot de passe incorrect|Bad credentials/i),
    ).toBeInTheDocument(),
  );
});

test('logout clears token and redirects to /', async () => {
  localStorage.setItem('cv_token', 'token-x');

  // mock /api/me to return the user (AuthProvider will call it)
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ id: 1, email: 'u@e.com', fullName: 'User' }),
    text: async () => JSON.stringify({ id: 1, email: 'u@e.com' }),
  });

  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<div data-testid="home">HOME</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

  // wait for user to appear in header
  await waitFor(() => expect(screen.getByText(/u@e.com|User/i)).toBeInTheDocument());

  // open dropdown and click logout
  fireEvent.click(screen.getByText(/u@e.com|User/i));
  fireEvent.click(screen.getByText(/Se déconnecter/i));

  expect(localStorage.getItem('cv_token')).toBeNull();
  await waitFor(() => expect(screen.getByTestId('home')).toBeInTheDocument());
});
