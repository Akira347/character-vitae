/* eslint-env jest */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AvatarEditor from '../AvatarEditor';

test('affichage initial et sauvegarde', () => {
  const onSave = jest.fn();
  const onCancel = jest.fn();
  render(<AvatarEditor show={true} data={{}} onSave={onSave} onCancel={onCancel} />);

  // Titre exact
  expect(screen.getByText(/Personnalisation de l'avatar/i)).toBeInTheDocument();

  // on récupère simplement le premier combobox disponible
  const [sexeSelect] = screen.getAllByRole('combobox');
  // on vérifie qu'il contient bien nos options
  expect(within(sexeSelect).getByRole('option', { name: 'Homme' })).toBeInTheDocument();
  expect(within(sexeSelect).getByRole('option', { name: 'Femme' })).toBeInTheDocument();
  fireEvent.change(sexeSelect, { target: { value: 'Femme' } });

  // Sauvegarder
  fireEvent.click(screen.getByText('Enregistrer'));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ sexe: 'Femme' }));
});
