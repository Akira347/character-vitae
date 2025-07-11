import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import NotFoundPage  from './pages/NotFoundPage';
import Layout from './components/structure/Layout';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
