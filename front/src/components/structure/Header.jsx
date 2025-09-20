// src/components/structure/Header.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav, Modal, Button, Form, Alert, NavDropdown } from 'react-bootstrap';
import PlumeIcon from '../../assets/icons/plume.png';
import { Link } from 'react-router-dom';
import SignupForm from '../auth/SignupForm';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const open = params.get('openLogin');
    const confirmed = params.get('confirmed');

    if (open === '1' || confirmed === '1') {
      setView('login');
      setShow(true);
      // remove params
      params.delete('openLogin');
      params.delete('confirmed');
      const newSearch = params.toString();
      navigate(location.pathname + (newSearch ? '?' + newSearch : ''), { replace: true });
    }
  }, [location, navigate]);

  const [show, setShow] = useState(false);
  const [view, setView] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupSuccessMessage, setSignupSuccessMessage] = useState(null);

  // auth
  const [user, setUser] = useState(null); // { id, email, fullName, ... }
  const tokenKey = 'cv_token';

  // try restoring user from token on mount
  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((json) => setUser(json))
        .catch(() => {
          localStorage.removeItem(tokenKey);
          setUser(null);
        });
    }
  }, []);

  const openLogin = () => {
    setView('login');
    setShow(true);
    setLoginError(null);
  };

  const handleLogin = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const resp = await fetch('/api/login_check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginEmail, password: loginPassword }),
      });

      const text = await resp.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (resp.ok && json && json.token) {
        // store token, fetch /api/me and set user
        localStorage.setItem(tokenKey, json.token);
        const meResp = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${json.token}` },
        });
        if (meResp.ok) {
          const meJson = await meResp.json();
          setUser(meJson);
        }
        setShow(false);
      } else {
        let msg = 'E-mail ou mot de passe incorrect';
        if (json && (json.message || json.error)) msg = json.message || json.error;
        setLoginError(msg);
      }
    } catch (err) {
      console.error('login error', err);
      setLoginError('Impossible de joindre le serveur.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(tokenKey);
    setUser(null);
  };

  return (
    <>
      <Navbar expand="lg" className="px-3">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="brand-logo">
            Character Vitae
          </Navbar.Brand>
          <Nav className="ms-auto">
            {!user ? (
              <Nav.Link onClick={openLogin} aria-label="Open login">
                <img
                  src={PlumeIcon}
                  alt="Connexion"
                  style={{ width: 56, height: 56, objectFit: 'contain' }}
                />
              </Nav.Link>
            ) : (
              <NavDropdown title={user.fullName || user.email} id="user-dropdown" align="end">
                <NavDropdown.Item
                  onClick={() => {
                    /* go to profile */
                  }}
                >
                  Mon profil
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => handleLogout()}>Se déconnecter</NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Container>
      </Navbar>

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{view === 'login' ? 'Se connecter' : "S'inscrire"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {view === 'login' ? (
            <>
              {signupSuccessMessage && <Alert variant="success">{signupSuccessMessage}</Alert>}
              {loginError && <Alert variant="danger">{loginError}</Alert>}
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
              >
                <Form.Group className="mb-3" controlId="loginEmail">
                  <Form.Label>Adresse e-mail</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="email@exemple.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={loginLoading}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="loginPassword">
                  <Form.Label>Mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={loginLoading}
                  />
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Button
                      variant="link"
                      onClick={() => setView('signup')}
                      disabled={loginLoading}
                    >
                      Pas de compte ? Inscrivez-vous
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="secondary"
                      onClick={() => setShow(false)}
                      className="me-2"
                      disabled={loginLoading}
                    >
                      Annuler
                    </Button>
                    <Button variant="primary" type="submit" disabled={loginLoading}>
                      {loginLoading ? (
                        <>
                          <Spinner animation="border" size="sm" />
                          &nbsp;Connexion...
                        </>
                      ) : (
                        'Connexion'
                      )}
                    </Button>
                  </div>
                </div>
              </Form>
            </>
          ) : (
            <SignupForm
              onCancel={() => setShow(false)}
              onSwitchToLogin={() => setView('login')}
              onSuccess={() => {
                setView('login');
                setSignupSuccessMessage(
                  'Inscription réussie — vérifiez votre boîte mail pour confirmer votre compte.',
                );
                setTimeout(() => setSignupSuccessMessage(null), 2000);
              }}
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
