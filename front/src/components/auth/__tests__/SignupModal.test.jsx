import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SignupModal from './SignupModal';

test('renders signup modal and validates inputs', () => {
  render(<SignupModal show={true} onHide={() => {}} />);
  expect(screen.getByLabelText(/Adresse e-mail/i)).toBeInTheDocument();

  const emailInput = screen.getByLabelText(/Adresse e-mail/i);
  const passInput = screen.getByLabelText(/Mot de passe/i);
  const confirmInput = screen.getByLabelText(/Confirmez le mot de passe/i);
  const submitBtn = screen.getByRole('button', { name: /S'inscrire/i });

  // invalid email
  fireEvent.change(emailInput, { target: { value: 'invalid' } });
  fireEvent.change(passInput, { target: { value: 'short' } });
  fireEvent.change(confirmInput, { target: { value: 'short' } });
  fireEvent.click(submitBtn);

  expect(screen.getByText(/Format d'email invalide/i)).toBeInTheDocument();
  expect(screen.getByText(/mot de passe doit contenir/i)).toBeInTheDocument();

  // valid -> simulate filling valid inputs
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passInput, { target: { value: 'longpassword' } });
  fireEvent.change(confirmInput, { target: { value: 'longpassword' } });
  // submit will call fetch; you can mock fetch with jest.spyOn(global, 'fetch').mockResolvedValue(...)
});
