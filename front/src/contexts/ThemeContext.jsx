import React, { createContext } from 'react';
import PropTypes from 'prop-types';

/**
 * Contexte de thème global (couleurs, polices, espacements).
 * Permet de récupérer les variables CSS définies dans :root.
 */
export const ThemeContext = createContext({
  colors: {
    primary: 'var(--text-color)',
    accent: 'var(--color-accent)',
  },
  fonts: {
    title: 'var(--heading-color)',
    body: 'var(--font-body)',
  },
  spacing: (n) => `calc(var(--spacer) * ${n})`,
});

/**
 * Provider qui enveloppe l’application et expose le contexte.
 *
 * @param {{children: React.ReactNode}} children  Noeuds enfants du ThemeContext
 * @returns {JSX.Element} Le ThemeProvider
 */
export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={React.useContext(ThemeContext)}>{children}</ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
