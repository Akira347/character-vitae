// front/src/components/section/__tests__/SectionPreview.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import SectionPreview from '../SectionPreview';

describe('SectionPreview', () => {
  test('renders "Aucun contenu" for empty array', () => {
    render(<SectionPreview data={[]} />);
    expect(screen.getByText(/Aucun contenu/i)).toBeInTheDocument();
  });

  test('renders array items', () => {
    render(<SectionPreview data={[{ title: 'T' }, { title: 'U' }]} />);
    // There might be repeated occurrences of 'T' in markup, but ensure the specific texts exist
    expect(screen.getAllByText(/T|U/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  test('does not render empty fields for objects', () => {
    const data = { nom: 'Jean', phone: '' };
    render(<SectionPreview data={data} />);
    expect(screen.getByText(/nom/i)).toBeInTheDocument();
    expect(screen.queryByText(/phone/i)).not.toBeInTheDocument();
  });
});
