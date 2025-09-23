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
