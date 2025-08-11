import React from 'react';
import { Container } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import Header from '../structure/Header';
import Footer from '../structure/Footer';

/**
 * Layout principal :
 * - En-tête (Header), zone de contenu (Outlet) et pied de page (Footer).
 * - Gère la mise en page en flex-colonne sur toute la hauteur.
 *
 * @returns {JSX.Element} Le rendu du composant Layout
 */
export default function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container fluid className="px-0 my-4">
        <Outlet />
      </Container>
      <Footer />
    </div>
  );
}
