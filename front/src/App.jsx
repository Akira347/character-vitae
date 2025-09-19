import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/structure/Layout';
import Dashboard from './pages/Dashboard';
import NotFoundPage from './pages/NotFoundPage';
import Confirm from "./pages/Confirm";

/**
 * Point d’entrée de l’application.
 * Monte le ThemeProvider, le Router et le Layout.
 *
 * @returns {JSX.Element} Le rendu du composant App
 */
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="/confirm" element={<Confirm />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
