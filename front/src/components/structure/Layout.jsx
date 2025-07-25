import React from 'react';
import { Container } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import Header from '../structure/Header';
import Footer from '../structure/Footer';

export default function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="my-4">
        <Outlet />
      </Container>
      <Footer />
    </div>
  );
}
