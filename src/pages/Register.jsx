import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { appConfig } from '../config';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import cartService from '../services/cartService';
import styles from '../styles/AuthPage.module.css';

function Register() {
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const { authError, clearAuthError, isSubmittingAuth, register } = useAuth();
  const { cart, cartError, cartHydrationStatus, isCartReady } = useCart();
  const navigate = useNavigate();
  const isRemoteMode = appConfig.useRemoteApi;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setFormError('');
    clearAuthError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (values.password !== values.confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }

    const guestCartId = isRemoteMode ? cartService.getGuestCartIdForAuth(cart) : '';

    const result = await register({
      firstName: values.firstName,
      lastName: values.lastName,
      ...(guestCartId ? { guestCartId } : {}),
      email: values.email,
      password: values.password,
      phone: values.phone,
    });

    if (!result.ok) {
      setFormError(result.error ?? 'No fue posible crear la cuenta.');
      return;
    }

    navigate('/user/profile', { replace: true });
  };

  const submitDisabled = isSubmittingAuth || (isRemoteMode && cartHydrationStatus === 'hydrating');
  const blockedMessage =
    isRemoteMode && cartHydrationStatus === 'hydrating'
      ? 'Preparando carrito para conservar tus productos antes de autenticarte...'
      : '';

  return (
    <section className={styles.container}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Semana 12</p>
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>
          {isRemoteMode
            ? 'Crea una cuenta conectada al backend para mantener sesión, asociar direcciones y continuar el checkout autenticado.'
            : 'Registra un usuario local con rol cliente para mantener sesión, proteger rutas y asociar compras a tu perfil.'}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Nombre</span>
            <input
              className={styles.input}
              disabled={submitDisabled}
              name="firstName"
              value={values.firstName}
              onChange={handleChange}
              placeholder="Ejemplo: Ana"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Apellido</span>
            <input
              className={styles.input}
              disabled={submitDisabled}
              name="lastName"
              value={values.lastName}
              onChange={handleChange}
              placeholder="Ejemplo: Gómez"
            />
          </label>

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
            <span className={styles.label}>Teléfono</span>
            <input
              className={styles.input}
              disabled={submitDisabled}
              name="phone"
              value={values.phone}
              onChange={handleChange}
              placeholder="3001234567"
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

          <label className={styles.field}>
            <span className={styles.label}>Confirmar contraseña</span>
            <input
              className={styles.input}
              disabled={submitDisabled}
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange}
              placeholder="Repite la contraseña"
              type="password"
            />
          </label>

          {formError || authError || blockedMessage ? (
            <p className={styles.error}>{formError || authError || blockedMessage}</p>
          ) : null}

          <button type="submit" className={styles.primaryButton} disabled={submitDisabled}>
            {isSubmittingAuth ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className={styles.helperText}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>.
        </p>
      </div>
    </section>
  );
}

export default Register;
