// front/setupTests.js
// Chargé par Jest avant les tests (défini dans package.json)
// Fournit les matchers jest-dom et quelques polyfills légers.

import '@testing-library/jest-dom'; // <-- import moderne et compatible

// Polyfill TextEncoder / TextDecoder si nécessaire (Node < 11 compat)
(function ensureTextCodec() {
  try {
    // eslint-disable-next-line global-require
    const util = require('util');
    if (typeof global.TextEncoder === 'undefined' && typeof util.TextEncoder !== 'undefined') {
      // eslint-disable-next-line no-global-assign
      global.TextEncoder = util.TextEncoder;
    }
    if (typeof global.TextDecoder === 'undefined' && typeof util.TextDecoder !== 'undefined') {
      // eslint-disable-next-line no-global-assign
      global.TextDecoder = util.TextDecoder;
    }
  } catch (e) {
    // rien à faire si l'API n'existe pas
  }
})();

// Petit patch safe pour console.warn (évite spam noisy warnings dans tests)
(function patchConsoleWarn() {
  const originalWarn = console.warn.bind(console);
  console.warn = (...args) => {
    try {
      const first = args[0];
      if (typeof first === 'string' && first.includes('React Router Future Flag Warning')) {
        return;
      }
    } catch (e) {
      // ignore
    }
    originalWarn(...args);
  };
})();

// --------------------------------------------------------------------------------
// Mock global fetchJson utilisé par les composants pour éviter les appels réseau
// (si un test veut un comportement spécifique, il peut override jest.mock dans le test)
// --------------------------------------------------------------------------------

/**
 * IMPORTANT:
 * - Le chemin ici doit être relatif à la racine du package jest, dans ton cas front/src/utils/api
 * - Jest est configuré pour resolve <rootDir> vers le dossier "front" (setupFilesAfterEnv uses <rootDir>/setupTests.js)
 */
jest.mock('./src/utils/api', () => {
  return {
    fetchJson: jest.fn(async (url, opts) => {
      const u = String(url || '').toLowerCase();

      if (u.includes('/apip/characters') && (opts?.method ?? 'GET').toUpperCase() === 'GET') {
        return { data: { member: [] } };
      }

      if (u.includes('/apip/character/demo')) {
        return {
          id: 'demo',
          title: 'Demo',
          templateType: 'template1',
          layout: {
            rows: [
              [
                { id: 's1', type: 'Identité', width: 300, content: [], isCollapsed: false },
                { id: 's2', type: 'Lore', width: 300, content: [], isCollapsed: false },
              ],
            ],
          },
          avatar: {},
        };
      }

      return null;
    }),
  };
});

// Optionnel : silence console.debug/info en tests si tu veux moins de bruit.
// Décommente si trop de logs te gênent.

beforeAll(() => {
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
});
