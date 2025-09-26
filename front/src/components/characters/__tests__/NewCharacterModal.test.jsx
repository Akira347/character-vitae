// front/src/components/characters/__tests__/NewCharacterModal.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewCharacterModal from '../NewCharacterModal';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../../contexts/AuthContext';

beforeEach(() => {
    global.fetch = jest.fn();
});

afterEach(() => {
    jest.resetAllMocks();
});

function renderModal(props = {}) {
    return render(
        <AuthContext.Provider value={{ token: 'FAKE.TOKEN' }}>
            <BrowserRouter>
                <NewCharacterModal show={true} onHide={() => { }} {...props} />
            </BrowserRouter>
        </AuthContext.Provider>
    );
}

test('renders form and validates title required', async () => {
    renderModal();
    const submitButton = screen.getByRole('button', { name: /Enregistrer/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
        // message exact mis à jour dans le composant : "Le titre est obligatoire."
        expect(screen.getByText(/Le titre est obligatoire/i)).toBeInTheDocument();
    });
});

test('submits form and navigates on success', async () => {
    // fetchJson tries /api/characters, then returns body via text() parsing
    global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ id: 42, title: 'X' }),
    });

    const fakeOnHide = jest.fn();
    render(
        <AuthContext.Provider value={{ token: 'FAKE.TOKEN' }}>
            <BrowserRouter>
                <NewCharacterModal show={true} onHide={fakeOnHide} />
            </BrowserRouter>
        </AuthContext.Provider>
    );

    fireEvent.change(screen.getByLabelText(/Titre de la fiche/i), { target: { value: 'Mon héros' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => {
        expect(fakeOnHide).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalled();
    });
});