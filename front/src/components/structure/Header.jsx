import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
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
import HeaderDeleteButton from './HeaderDeleteButton';
import { fetchJson } from '../../utils/api';
import '../../styles/header.css';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, logout, token, resendConfirmation } = useContext(AuthContext) || {};
  console.debug('Header render: AuthContext', { user, token: !!token });

  // login/signup modal
  const [show, setShow] = useState(false);
  const [view, setView] = useState('login');

  // login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginUnconfirmed, setLoginUnconfirmed] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupSuccessMessage, setSignupSuccessMessage] = useState(null);

  // characters
  const [characters, setCharacters] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState(null); // always string or null
  const [loadingChars, setLoadingChars] = useState(false);
  const [charsError, setCharsError] = useState(null);

  // modal create/edit
  const [showNewCharacter, setShowNewCharacter] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [modalInitialData, setModalInitialData] = useState(null);

  // inline notification
  const [inlineNotify, setInlineNotify] = useState(null);

  // Save button dirty state (listened from Dashboard)
  const [isDirty, setIsDirty] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Robust id extractor -> ALWAYS returns string or null
  const extractId = (item) => {
    if (!item) return null;
    if (typeof item.id === 'number' || typeof item.id === 'string') {
      return String(item.id);
    }
    const atId = item['@id'] ?? item['@id'];
    if (typeof atId === 'string') {
      const parts = atId.split('/');
      const last = parts[parts.length - 1];
      if (last) {
        return String(last);
      }
    }
    return null;
  };

  const loadCharacters = useCallback(
    async (preferredId = null, signal = undefined) => {
      console.debug('loadCharacters: start', {
        preferredId,
        selectedCharId,
        user: !!user,
        token: !!token,
      });

      if (mountedRef.current) setLoadingChars(true);
      if (mountedRef.current) setCharsError(null);

      if (!user) {
        console.debug('loadCharacters: no user, aborting.');
        if (mountedRef.current) {
          setCharacters([]);
          setSelectedCharId(null);
          setLoadingChars(false);
        }
        return [];
      }

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        console.debug('loadCharacters: fetching /apip/characters', { headers });
        const data = await fetchJson('/apip/characters', { method: 'GET', headers, signal });

        console.debug('loadCharacters: raw response from fetchJson', { data });

        const dataRaw = data?.data ?? data;
        console.debug('loadCharacters: normalized dataRaw', { dataRaw });

        let list = [];
        if (Array.isArray(dataRaw)) {
          list = dataRaw;
        } else if (dataRaw && Array.isArray(dataRaw.member)) {
          list = dataRaw.member;
        } else if (dataRaw && Array.isArray(dataRaw['hydra:member'])) {
          list = dataRaw['hydra:member'];
        } else if (dataRaw && Array.isArray(dataRaw['members'])) {
          list = dataRaw['members'];
        } else if (dataRaw && typeof dataRaw === 'object') {
          list = Object.values(dataRaw);
        }

        const normalized = list
          .map((c) => {
            const id = extractId(c);
            const title =
              typeof c?.title === 'string' && c.title.length ? c.title : id ? `#${id}` : undefined;
            return { raw: c, id, title };
          })
          .filter((x) => x.id !== null && x.id !== undefined);

        console.debug('loadCharacters: normalized entries', {
          normalizedCount: normalized.length,
          sample: normalized.slice(0, 5),
        });

        if (mountedRef.current) {
          setCharacters(normalized);
        } else {
          console.debug('loadCharacters: instance not mounted any more, skipping setCharacters');
        }

        const pref = preferredId ? String(preferredId) : null;
        const currentSel = selectedCharId ? String(selectedCharId) : null;
        const lastSelected = localStorage.getItem('cv_selected_char');

        let toSelect = null;
        if (pref && normalized.find((n) => String(n.id) === pref)) {
          toSelect = pref;
        } else if (currentSel && normalized.find((n) => String(n.id) === currentSel)) {
          toSelect = currentSel;
        } else if (lastSelected && normalized.find((n) => String(n.id) === String(lastSelected))) {
          toSelect = String(lastSelected);
        } else if (normalized.length > 0) {
          toSelect = String(normalized[0].id);
        } else {
          toSelect = null;
        }

        console.debug('loadCharacters: decided toSelect', {
          toSelect,
          pref,
          currentSel,
          lastSelected,
        });

        if (mountedRef.current) {
          if (toSelect !== null) {
            setSelectedCharId(String(toSelect));
            localStorage.setItem('cv_selected_char', String(toSelect));
            try {
              if (!location.pathname.startsWith(`/dashboard/characters/${toSelect}`)) {
                navigate(`/dashboard/characters/${toSelect}`);
              }
            } catch (e) {
              // ignore
            }
          } else {
            setSelectedCharId(null);
            localStorage.removeItem('cv_selected_char');
          }
        } else {
          console.debug('loadCharacters: skipping selection/navigate because not mounted');
        }

        return normalized;
      } catch (err) {
        if (err && err.name === 'AbortError') {
          console.debug('loadCharacters: aborted', err);
        } else {
          if (mountedRef.current)
            setCharsError(err?.message || 'Impossible de charger les fiches.');
          console.error('loadCharacters error', err);
        }
        if (mountedRef.current) setCharacters([]);
        return [];
      } finally {
        if (mountedRef.current) setLoadingChars(false);
        console.debug('loadCharacters: finished (loadingChars false)');
      }
    },
    [user, token, navigate],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadCharacters(null, controller.signal).catch(() => {});
    return () => controller.abort();
  }, [loadCharacters]);

  useEffect(() => {
    const onSessionExpired = () => {
      window.dispatchEvent(
        new CustomEvent('notify', {
          detail: {
            message: 'Session expirée — reconnectez-vous',
            variant: 'warning',
            timeout: 5000,
          },
        }),
      );
      setView('login');
      setShow(true);
    };
    window.addEventListener('session-expired', onSessionExpired);
    return () => window.removeEventListener('session-expired', onSessionExpired);
  }, []);

  useEffect(() => {
    const onOpenSignup = (ev) => {
      setView('signup');
      setShow(true);
    };
    window.addEventListener('open-signup', onOpenSignup);
    return () => window.removeEventListener('open-signup', onOpenSignup);
  }, []);

  useEffect(() => {
    const onNotify = (ev) => {
      const d = (ev && ev.detail) || {};
      setInlineNotify({ message: d.message || 'Info', variant: d.variant || 'info' });
      const timeout = typeof d.timeout === 'number' ? d.timeout : 3000;
      setTimeout(() => setInlineNotify(null), timeout);
    };

    const onCreated = async (ev) => {
      const idRaw = ev?.detail?.id ?? null;
      const id = idRaw ? String(idRaw) : null;
      const controller = new AbortController();
      await loadCharacters(id, controller.signal);
      if (id) {
        setSelectedCharId(String(id));
        localStorage.setItem('cv_selected_char', String(id));
        try {
          navigate(`/dashboard/characters/${id}`);
        } catch (e) {
          // ignore
        }
      }
      window.dispatchEvent(
        new CustomEvent('notify', {
          detail: { message: 'Fiche créée', variant: 'success', timeout: 2500 },
        }),
      );
    };

    const onUpdated = async () => {
      await loadCharacters(null);
      window.dispatchEvent(
        new CustomEvent('notify', {
          detail: { message: 'Fiche mise à jour', variant: 'success', timeout: 2000 },
        }),
      );
    };

    const onDeleted = async (ev) => {
      const list = await loadCharacters(null);
      window.dispatchEvent(
        new CustomEvent('notify', {
          detail: { message: 'Fiche supprimée', variant: 'info', timeout: 2000 },
        }),
      );
    };

    const onDirtyChanged = (ev) => {
      const d = ev?.detail ?? {};
      setIsDirty(Boolean(d.isDirty));
    };

    window.addEventListener('notify', onNotify);
    window.addEventListener('character-created', onCreated);
    window.addEventListener('character-updated', onUpdated);
    window.addEventListener('character-deleted', onDeleted);
    window.addEventListener('dirty-changed', onDirtyChanged);

    return () => {
      window.removeEventListener('notify', onNotify);
      window.removeEventListener('character-created', onCreated);
      window.removeEventListener('character-updated', onUpdated);
      window.removeEventListener('character-deleted', onDeleted);
      window.removeEventListener('dirty-changed', onDirtyChanged);
    };
  }, [loadCharacters, navigate]);

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
        navigate('/dashboard');
        setTimeout(() => loadCharacters(), 200);
      } else {
        setLoginUnconfirmed(Boolean(result.unconfirmed));
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
    const id = ev.target.value ? String(ev.target.value) : null;
    setSelectedCharId(id);
    if (id) {
      localStorage.setItem('cv_selected_char', String(id));
      navigate(`/dashboard/characters/${id}`);
    }
  };

  const onHeaderSave = async () => {
    if (!characters || characters.length === 0) {
      try {
        const headers = {
          'Content-Type': 'application/ld+json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const body = {
          title: 'Mon CV',
          description: '',
          templateType: 'blank',
        };
        const res = await fetchJson('/api/characters', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
        const newId = res?.id ?? (res?.data && res.data.id) ?? null;
        window.dispatchEvent(new CustomEvent('character-created', { detail: { id: newId } }));
      } catch (err) {
        console.error('Erreur création Mon CV', err);
        window.dispatchEvent(
          new CustomEvent('notify', {
            detail: { message: 'Impossible de créer Mon CV', variant: 'danger', timeout: 4000 },
          }),
        );
        return;
      }
    }
    window.dispatchEvent(new CustomEvent('save-character'));
  };

  const onNewCharacterHide = () => {
    setShowNewCharacter(false);
    setModalInitialData(null);
    setModalMode('create');
    setTimeout(() => {
      if (!characters || characters.length === 0) {
        loadCharacters();
      }
    }, 400);
  };

  const onEditClick = () => {
    if (!selectedCharId) return;
    const found = characters.find((c) => String(c.id) === String(selectedCharId));
    setModalMode('edit');
    setModalInitialData(found ? found.raw : { id: selectedCharId });
    setShowNewCharacter(true);
  };

  return (
    <>
      <Navbar expand="lg" className="px-3">
        <Container fluid className="d-flex align-items-center">
          <Navbar.Brand as={Link} to="/" className="brand-logo me-auto">
            Character Vitae
          </Navbar.Brand>

          <Nav className="ms-auto align-items-center">
            {/* Profil démo : affichée uniquement si NON connecté */}
            {!user && (
              <div className="me-2 d-none d-md-block">
                <button
                  type="button"
                  onClick={() => navigate('/demo')}
                  title="Voir un profil de démonstration"
                  className="btn-demo"
                >
                  Profil de démonstration
                </button>
              </div>
            )}

            {user && (
              <>
                <div className="me-2 d-flex align-items-center">
                  {/* Sauvegarder : applique le même style 'btn-demo' et devient doré quand isDirty */}
                  <Button
                    size="sm"
                    className="btn-demo"
                    onClick={onHeaderSave}
                    aria-label="Sauvegarder"
                    style={{
                      background: isDirty ? '#FFD700' : undefined,
                      borderColor: isDirty ? '#E6C200' : undefined,
                      color: isDirty ? '#000' : undefined,
                      fontWeight: isDirty ? 700 : undefined,
                    }}
                  >
                    {isDirty ? 'Sauvegarder*' : 'Sauvegarder'}
                  </Button>
                </div>

                <div className="me-2">
                  {loadingChars ? (
                    <Spinner animation="border" size="sm" />
                  ) : characters && characters.length > 0 ? (
                    <Form.Select
                      size="sm"
                      value={selectedCharId ?? ''}
                      onChange={onSelectCharacter}
                      aria-label="Choisir fiche"
                      style={{ minWidth: 200 }}
                    >
                      {characters.map((c) => (
                        <option key={String(c.id)} value={String(c.id)}>
                          {c.title ?? `#${c.id}`}
                        </option>
                      ))}
                    </Form.Select>
                  ) : null}
                </div>

                {characters.length > 0 && (
                  <div className="me-2">
                    <Button
                      size="sm"
                      variant="outline-light"
                      onClick={onEditClick}
                      aria-label="Éditer la fiche sélectionnée"
                      style={{ marginRight: 8 }}
                    >
                      ✎ Éditer
                    </Button>
                  </div>
                )}

                <Nav.Item className="me-2">
                  <Button
                    className="btn-parchment"
                    onClick={() => {
                      setModalMode('create');
                      setModalInitialData(null);
                      setShowNewCharacter(true);
                    }}
                    aria-label="Nouveau personnage"
                    onMouseOver={(e) => (e.currentTarget.style.border = '1px solid #FFD700')}
                    onMouseOut={(e) => (e.currentTarget.style.border = '1px solid transparent')}
                  >
                    + Nouveau personnage
                  </Button>
                </Nav.Item>
              </>
            )}

            {!user ? (
              <Nav.Link
                onClick={openLogin}
                aria-label="Open login"
                className="d-flex align-items-center"
              >
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

      {/* login modal */}
      <Modal show={show} onHide={() => setShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{view === 'login' ? 'Se connecter' : "S'inscrire"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {view === 'login' ? (
            <>
              {signupSuccessMessage && <Alert variant="success">{signupSuccessMessage}</Alert>}
              {loginError && (
                <Alert variant="danger">
                  <div>{loginError}</div>
                  {loginUnconfirmed && (
                    <div className="mt-2">
                      <button
                        type="button"
                        className="btn btn-link btn-sm"
                        onClick={async () => {
                          const resp = await resendConfirmation(loginEmail);
                          if (resp && resp.ok) {
                            setLoginError(null);
                            setInlineNotify({
                              message: resp.body?.message ?? 'E-mail renvoyé',
                              variant: 'success',
                            });
                            setTimeout(() => setInlineNotify(null), 3500);
                          } else {
                            setInlineNotify({
                              message: 'Impossible de renvoyer l’e-mail',
                              variant: 'danger',
                            });
                            setTimeout(() => setInlineNotify(null), 3500);
                          }
                        }}
                      >
                        Renvoyer l’e-mail de confirmation
                      </button>
                    </div>
                  )}
                </Alert>
              )}
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

      <NewCharacterModal
        show={showNewCharacter}
        onHide={onNewCharacterHide}
        mode={modalMode}
        initialData={modalInitialData}
      />
    </>
  );
}
