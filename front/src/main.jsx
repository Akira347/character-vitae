import './styles/global.scss';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Fichier d’amorçage React :
 * - Importe les styles globaux.
 * - Monte <App /> dans #root.
 */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
