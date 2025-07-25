import React, { createContext } from 'react';
import PropTypes from 'prop-types';

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

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={React.useContext(ThemeContext)}>{children}</ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
