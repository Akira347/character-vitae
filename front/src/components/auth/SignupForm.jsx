// src/components/auth/SignupForm.jsx
import React, { useEffect, useState } from 'react';
import { Form, Alert, Spinner, Button } from 'react-bootstrap';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupForm({ onSuccess, onCancel, onSwitchToLogin }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // field-level errors object
  const [fieldErrors, setFieldErrors] = useState({
    firstName: null,
    lastName: null,
    email: null,
    password: null,
  });

  useEffect(() => {
    if (passwordConfirm.length > 0 && passwordConfirm.length >= password.length) {
      setPasswordMismatch(password !== passwordConfirm);
      if (password !== passwordConfirm) {
        setFieldErrors((s) => ({ ...s, password: 'Les mots de passe ne correspondent pas.' }));
      } else {
        setFieldErrors((s) => ({ ...s, password: null }));
      }
    } else {
      setPasswordMismatch(false);
      setFieldErrors((s) => ({ ...s, password: null }));
    }
  }, [password, passwordConfirm]);

  const validateLocal = () => {
    const e = [];
    if (!firstName.trim()) e.push('Le prénom est requis.');
    if (!lastName.trim()) e.push('Le nom est requis.');
    if (!EMAIL_REGEX.test(email)) e.push("Format d'email invalide.");
    if (password.length < 8) e.push('Le mot de passe doit contenir au moins 8 caractères.');
    if (password !== passwordConfirm) e.push('La confirmation du mot de passe ne correspond pas.');
    if (emailError) e.push(emailError);
    return e;
  };

  const safeParse = (text) => {
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  };

  const checkEmailUnique = async () => {
    if (!email || !EMAIL_REGEX.test(email)) return;
    setEmailChecking(true);
    setEmailError(null);
    try {
      const resp = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (resp.status === 200) {
        const json = await resp.json();
        if (json.exists) {
          setEmailError('Cet e-mail est déjà utilisé.');
          setFieldErrors((s) => ({ ...s, email: 'Cet e-mail est déjà utilisé.' }));
        } else {
          setFieldErrors((s) => ({ ...s, email: null }));
        }
      }
    } catch (err) {
      console.debug('checkEmailUnique error', err);
    } finally {
      setEmailChecking(false);
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setErrors([]);
    setSuccessMsg(null);
    setFieldErrors({ firstName: null, lastName: null, email: null, password: null });

    const v = validateLocal();
    if (v.length) {
      setErrors(v);
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const text = await resp.text();
      const json = safeParse(text);

      if (resp.status === 201) {
        const msg = 'Inscription réussie — vérifiez votre boîte mail pour confirmer votre compte.';
        setSuccessMsg(msg);
        setErrors([]);
        setFieldErrors({ firstName: null, lastName: null, email: null, password: null });
        setTimeout(() => {
          setSuccessMsg(null);
          if (typeof onSuccess === 'function') onSuccess();
        }, 1400);
      } else if (resp.status === 422) {
        // validation errors from API
        const violations = json?.violations || [];
        const newFieldErrors = { firstName: null, lastName: null, email: null, password: null };
        violations.forEach((v) => {
          if (v.propertyPath) {
            // map backend property names -> our form fields if needed
            const key =
              v.propertyPath === 'firstName' || v.propertyPath === 'first_name'
                ? 'firstName'
                : v.propertyPath === 'lastName' || v.propertyPath === 'last_name'
                  ? 'lastName'
                  : v.propertyPath === 'email'
                    ? 'email'
                    : v.propertyPath === 'password'
                      ? 'password'
                      : null;
            if (key) newFieldErrors[key] = v.message;
          }
        });
        setFieldErrors(newFieldErrors);
        const global = json?.message || 'Erreurs de validation';
        setErrors([global]);
      } else if (resp.status === 400) {
        let msg = "Erreur lors de l'inscription.";
        if (json) {
          if (json.message) msg = json.message;
          else if (json.error) msg = json.error;
        } else if (text) {
          msg = text;
        }
        setErrors([msg]);
      } else if (resp.status === 409) {
        setErrors(['Cet e-mail est déjà utilisé.']);
        setFieldErrors((s) => ({ ...s, email: 'Cet e-mail est déjà utilisé.' }));
      } else {
        setErrors([`Erreur serveur (${resp.status}). Réessayez plus tard.`]);
      }
    } catch (err) {
      console.error('Signup error', err);
      setErrors(['Impossible de joindre le serveur.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {errors.length > 0 && (
        <Alert variant="danger" data-testid="signup-errors">
          <ul className="mb-0">
            {errors.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" data-testid="signup-success">
          {successMsg}
        </Alert>
      )}

      <Form onSubmit={handleSubmit} data-testid="signup-form">
        <Form.Group className="mb-3" controlId="signupFirstName">
          <Form.Label>Prénom</Form.Label>
          <Form.Control
            type="text"
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
            required
            isInvalid={!!fieldErrors.firstName}
          />
          <Form.Control.Feedback type="invalid">{fieldErrors.firstName}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="signupLastName">
          <Form.Label>Nom</Form.Label>
          <Form.Control
            type="text"
            placeholder="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
            required
            isInvalid={!!fieldErrors.lastName}
          />
          <Form.Control.Feedback type="invalid">{fieldErrors.lastName}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="signupEmail">
          <Form.Label>Adresse e-mail</Form.Label>
          <Form.Control
            type="email"
            placeholder="email@exemple.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
              setFieldErrors((s) => ({ ...s, email: null }));
            }}
            onBlur={checkEmailUnique}
            required
            disabled={loading}
            isInvalid={!!fieldErrors.email}
          />
          <Form.Text className="text-muted">
            Nous utiliserons cet e-mail pour la confirmation.
          </Form.Text>
          {emailChecking && (
            <div className="mt-1">
              <small>Vérification de l'e-mail…</small>
            </div>
          )}
          <Form.Control.Feedback type="invalid">
            {fieldErrors.email || emailError}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="signupPassword">
          <Form.Label>Mot de passe</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            isInvalid={!!fieldErrors.password || passwordMismatch}
          />
          <Form.Text className="text-muted">Minimum 8 caractères</Form.Text>
          <Form.Control.Feedback type="invalid">
            {fieldErrors.password ||
              (passwordMismatch ? 'Les mots de passe ne correspondent pas.' : null)}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="signupPasswordConfirm">
          <Form.Label>Confirmez le mot de passe</Form.Label>
          <Form.Control
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            disabled={loading}
            isInvalid={passwordMismatch}
          />
          {passwordMismatch && (
            <Form.Control.Feedback type="invalid">
              Les mots de passe ne correspondent pas.
            </Form.Control.Feedback>
          )}
        </Form.Group>

        <div className="d-flex justify-content-between align-items-center">
          <div>
            <Button
              variant="link"
              onClick={() => onSwitchToLogin && onSwitchToLogin()}
              disabled={loading}
            >
              Déjà un compte ? Connectez-vous
            </Button>
          </div>
          <div>
            <Button
              variant="secondary"
              onClick={() => onCancel && onCancel()}
              className="me-2"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={loading || emailChecking}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" />
                  &nbsp;Inscription...
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </div>
        </div>
      </Form>
    </>
  );
}
