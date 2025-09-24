// src/components/structure/Header.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Navbar,
  Container,
  Nav,
  Modal,
  Button,
  Form,
  Alert,
  NavDropdown,
  Spinner,
} from 'react-bootstrap';
import PlumeIcon from '../../assets/icons/plume.png';
import { Link } from 'react-router-dom';
import SignupForm from '../auth/SignupForm';
import { AuthContext } from '../../contexts/AuthContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, logout } = useContext(AuthContext);

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

  const tokenKey = 'cv_token';

  // try restoring user from token on mount is handled by AuthProvider

  const openLogin = () => {
    setView('login');
    setShow(true);
    setLoginError(null);
  };

  const handleLogin = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const result = await login({ username: loginEmail, password: loginPassword });
      if (result.ok) {
        // succès : on ferme et on redirige vers la home (ou dashboard)
        setShow(false);
        navigate('/');
      } else {
        // résultat d'erreur : essayer d'extraire message utile
        let msg = 'E-mail ou mot de passe incorrect'; // message par défaut
        if (result.body) {
          let backendMsg = null;
          if (result.body.message) backendMsg = result.body.message;
          else if (result.body.error) backendMsg = result.body.error;
          else if (typeof result.body === 'string' && result.body.length) backendMsg = result.body;

          // traduction spécifique
          if (backendMsg === 'Invalid credentials.') {
            msg = 'E-mail ou mot de passe incorrect';
          } else if (backendMsg) {
            msg = backendMsg; // sinon utiliser le message du backend
          }
        }
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
    logout();
    navigate('/'); // redirection après logout
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
