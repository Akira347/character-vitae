// src/components/structure/Header.jsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
import SignupForm from '../auth/SignupForm';
import { AuthContext } from '../../contexts/AuthContext';
import NewCharacterModal from '../../components/characters/NewCharacterModal';
import { fetchJson } from '../../utils/api';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, logout, token } = useContext(AuthContext) || {};

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const open = params.get('openLogin');
    const confirmed = params.get('confirmed');

    if (open === '1' || confirmed === '1') {
      setView('login');
      setShow(true);
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

  const [showNewCharacter, setShowNewCharacter] = useState(false);

  const [characters, setCharacters] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [loadingChars, setLoadingChars] = useState(false);
  const [charsError, setCharsError] = useState(null);

  // Robust id extractor: prefer numeric id field, else parse '@id'
  const extractId = (item) => {
    if (!item) return null;
    if (typeof item.id === 'number' || typeof item.id === 'string') {
      return item.id;
    }
    const atId = item['@id'] ?? item['@id'];
    if (typeof atId === 'string') {
      const parts = atId.split('/');
      const last = parts[parts.length - 1];
      if (last) {
        // if last is numeric-ish, return as number
        const n = Number(last);
        return Number.isNaN(n) ? last : n;
      }
    }
    return null;
  };

  const loadCharacters = useCallback(async () => {
    if (!user) {
      setCharacters([]);
      setSelectedCharId(null);
      return;
    }
    setLoadingChars(true);
    setCharsError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const data = await fetchJson('/apip/characters', { method: 'GET', headers });

      let list = [];
      // ApiPlatform sometimes returns `member` (your sample), Hydra uses `hydra:member`
      if (Array.isArray(data)) {
        list = data;
      } else if (data && Array.isArray(data.member)) {
        list = data.member;
      } else if (data && Array.isArray(data['hydra:member'])) {
        list = data['hydra:member'];
      } else if (data && Array.isArray(data['members'])) {
        list = data['members'];
      } else if (data && typeof data === 'object') {
        // fallback: collect object values
        list = Object.values(data);
      }

      // Normalize items: ensure id/title exist
      const normalized = list
        .map((c) => {
          const id = extractId(c);
          const title =
            typeof c?.title === 'string' && c.title.length ? c.title : id ? `#${id}` : undefined;
          return {
            raw: c,
            id,
            title,
          };
        })
        .filter((x) => x.id !== null && x.id !== undefined);

      setCharacters(normalized);
      if (normalized.length > 0 && !selectedCharId) {
        setSelectedCharId(normalized[0].id);
      }
    } catch (err) {
      setCharsError(err?.message || 'Impossible de charger les fiches.');
      setCharacters([]);
    } finally {
      setLoadingChars(false);
    }
  }, [user, token, selectedCharId]);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

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
        setShow(false);
        navigate('/');
        setTimeout(() => loadCharacters(), 200);
      } else {
        let msg = 'E-mail ou mot de passe incorrect';
        if (result.body) {
          const backendMsg =
            result.body.message ??
            result.body.error ??
            (typeof result.body === 'string' ? result.body : null);
          if (backendMsg) msg = backendMsg;
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
    navigate('/');
  };

  const onSelectCharacter = (ev) => {
    const id = ev.target.value;
    setSelectedCharId(id);
    if (id) {
      navigate(`/dashboard/characters/${id}`);
    }
  };

  const onHeaderSave = () => {
    window.dispatchEvent(new CustomEvent('save-character'));
  };

  const onNewCharacterHide = () => {
    setShowNewCharacter(false);
    // refresh list after creation
    setTimeout(() => loadCharacters(), 300);
  };

  return (
    <>
      <Navbar expand="lg" className="px-3">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="brand-logo">
            Character Vitae
          </Navbar.Brand>

          <Nav className="ms-auto align-items-center">
            {user && (
              <>
                <div className="me-2 d-flex align-items-center">
                  <Button
                    size="sm"
                    variant="outline-light"
                    onClick={onHeaderSave}
                    aria-label="Sauvegarder"
                  >
                    Sauvegarder
                  </Button>
                </div>

                <div className="me-2">
                  {loadingChars ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <Form.Select
                      size="sm"
                      value={selectedCharId ?? ''}
                      onChange={onSelectCharacter}
                      aria-label="Choisir fiche"
                    >
                      <option value="">{charsError ? 'Erreur chargement' : 'Mes fiches'}</option>
                      {characters.map((c) => (
                        <option key={String(c.id)} value={String(c.id)}>
                          {c.title ?? `#${c.id}`}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </div>

                <Nav.Item className="me-2">
                  <Button
                    className="btn-parchment"
                    onClick={() => setShowNewCharacter(true)}
                    aria-label="Nouveau personnage"
                  >
                    + Nouveau personnage
                  </Button>
                </Nav.Item>
              </>
            )}

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
                <NavDropdown.Item>Mon profil</NavDropdown.Item>
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
                          {' '}
                          <Spinner animation="border" size="sm" /> &nbsp;Connexion...
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

      <NewCharacterModal show={showNewCharacter} onHide={onNewCharacterHide} />
    </>
  );
}
