/* eslint-env jest */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../Layout';

function Dummy() {
  return <div>CONTENT</div>;
}

test('affiche Header, Outlet et Footer', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dummy />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  // header
  expect(screen.getByText('Character Vitae')).toBeInTheDocument();
  // outlet
  expect(screen.getByText('CONTENT')).toBeInTheDocument();
  // footer (on suppose qu’il contient un texte unique, p. ex. "©")
  expect(screen.getByText(/©/i)).toBeInTheDocument();
});
