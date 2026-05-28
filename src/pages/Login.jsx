import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { appConfig } from '../config';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import cartService from '../services/cartService';
import styles from '../styles/AuthPage.module.css';
import { DEFAULT_ADMIN_USER } from '../utils/authStorage';

const fillDemoCredentials = (setValues, credentials) => {
  setValues({
    email: credentials.email,
    password: credentials.password,
  });
};

function Login() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');
  const { authError, clearAuthError, isSubmittingAuth, login } = useAuth();
  const { cart, cartError, cartHydrationStatus, isCartReady } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const isRemoteMode = appConfig.useRemoteApi;
  const remoteDemoCredentials = appConfig.remoteDemoCredentials;
  const shouldShowRemoteDemoCredentials =
    isRemoteMode &&
    appConfig.showRemoteDemoCredentials &&
    remoteDemoCredentials.admin.email &&
    remoteDemoCredentials.admin.password &&
    remoteDemoCredentials.customer.email &&
    remoteDemoCredentials.customer.password;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setFormError('');
    clearAuthError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isRemoteMode && !isCartReady) {
      setFormError(
        cartHydrationStatus === 'error'
          ? cartError || 'No fue posible preparar el carrito para iniciar sesión.'
          : 'Preparando el carrito antes de iniciar sesión.'
      );
      return;
    }

    const guestCartId = cartService.getGuestCartIdForAuth(cart);

    if (isRemoteMode && !guestCartId) {
      setFormError('No fue posible preparar un carrito invitado válido para iniciar sesión.');
      return;
    }

    const result = await login({
      email: values.email.trim(),
      guestCartId,
      password: values.password,
    });

    if (!result.ok) {
      setFormError(result.error ?? 'No fue posible iniciar sesión.');
      return;
    }

    const nextPath = location.state?.from || '/user/profile';
    navigate(nextPath, { replace: true });
  };

  const submitDisabled = isSubmittingAuth || (isRemoteMode && !isCartReady);
  const blockedMessage =
    isRemoteMode && !isCartReady
      ? cartHydrationStatus === 'error'
        ? cartError || 'No fue posible preparar el carrito para iniciar sesión.'
        : 'Preparando carrito para conservar tus productos antes de autenticarte...'
      : '';

  return (
    <section className={styles.container}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Semana 12</p>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>
          Accede a tu cuenta para proteger el checkout, diferenciar permisos y abrir el panel
          administrativo cuando el rol lo permita.
        </p>

        <div className={styles.infoBox}>
          <strong>
            {shouldShowRemoteDemoCredentials
              ? 'Credenciales seed demo backend'
              : 'Credenciales demo locales'}
          </strong>
          <div className={styles.credentialsList}>
            {shouldShowRemoteDemoCredentials ? (
              <>
                <span className={styles.credentialRow}>
                  Admin: {remoteDemoCredentials.admin.email} /{' '}
                  {remoteDemoCredentials.admin.password}
                </span>
                <span className={styles.credentialRow}>
                  Customer: {remoteDemoCredentials.customer.email} /{' '}
                  {remoteDemoCredentials.customer.password}
                </span>
                {remoteDemoCredentials.guestToken ? (
                  <span className={styles.credentialRow}>
                    Guest token demo: {remoteDemoCredentials.guestToken}
                  </span>
                ) : null}
                <div className={styles.demoActions}>
                  <button
                    type="button"
                    className={styles.demoActionButton}
                    disabled={submitDisabled}
                    onClick={() => fillDemoCredentials(setValues, remoteDemoCredentials.customer)}
                  >
                    Usar customer demo
                  </button>
                  <button
                    type="button"
                    className={styles.demoActionButton}
                    disabled={submitDisabled}
                    onClick={() => fillDemoCredentials(setValues, remoteDemoCredentials.admin)}
                  >
                    Usar admin demo
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className={styles.credentialRow}>Correo: {DEFAULT_ADMIN_USER.email}</span>
                <span className={styles.credentialRow}>
                  Contraseña: {DEFAULT_ADMIN_USER.password}
                </span>
              </>
            )}
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Correo electrónico</span>
            <input
              className={styles.input}
              disabled={submitDisabled}
              name="email"
              value={values.email}
              onChange={handleChange}
              placeholder="correo@dominio.com"
              type="email"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Contraseña</span>
            <input
              className={styles.input}
              disabled={submitDisabled}
              name="password"
              value={values.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              type="password"
            />
          </label>

          {formError || authError || blockedMessage ? (
            <p className={styles.error}>{formError || authError || blockedMessage}</p>
          ) : null}

          <button type="submit" className={styles.primaryButton} disabled={submitDisabled}>
            {isSubmittingAuth ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className={styles.helperText}>
          ¿Todavía no tienes cuenta? <Link to="/register">Regístrate aquí</Link>.
        </p>
      </div>
    </section>
  );
}

export default Login;
