import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupForm from '../SignupForm';

test('renders signup form and validates inputs', async () => {
  render(<SignupForm onSuccess={() => {}} onCancel={() => {}} onSwitchToLogin={() => {}} />);

  fireEvent.change(screen.getByPlaceholderText('Prénom'), { target: { value: 'Jean' } });
  fireEvent.change(screen.getByPlaceholderText('Nom'), { target: { value: 'Dupont' } });
  fireEvent.change(screen.getByLabelText(/Adresse e-mail/i), { target: { value: 'invalid' } });
  fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'short' } });
  fireEvent.change(screen.getByLabelText('Confirmez le mot de passe'), {
    target: { value: 'short' },
  });

  // ⚡ Soumission explicite
  fireEvent.submit(screen.getByTestId('signup-form'));

  // debug si besoin
  // screen.debug();

  // Vérifier que l'alerte d'erreurs apparaît
  const errorsAlert = await screen.findByTestId('signup-errors');
  expect(errorsAlert).toHaveTextContent(/Format/i);
  expect(errorsAlert).toHaveTextContent(/mot de passe/i);
});
