import { useMemo, useState } from 'react';

import {
  PAYMENT_OPTIONS,
  SHIPPING_OPTIONS,
  calculateOrderTotals,
} from '../utils/calculateOrderTotals';
import styles from '../styles/Checkout.module.css';

const emptyForm = {
  name: '',
  email: '',
  address: '',
  shipping: SHIPPING_OPTIONS[0].id,
  payment: PAYMENT_OPTIONS[0].id,
};

function Checkout({ cartItems, onConfirm, onBack }) {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const totals = useMemo(
    () => calculateOrderTotals(cartItems, values.shipping),
    [cartItems, values.shipping]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!values.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    if (!values.email.trim()) newErrors.email = 'El email es obligatorio.';
    if (!values.address.trim()) newErrors.address = 'La dirección es obligatoria.';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm({
      customer: {
        name: values.name.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
      },
      shipping: SHIPPING_OPTIONS.find((o) => o.id === values.shipping),
      payment: PAYMENT_OPTIONS.find((o) => o.id === values.payment),
      totals,
      items: cartItems,
    });
  };

  return (
    <section className={styles.container}>
      <button type="button" className={styles.btnBack} onClick={onBack}>
        ← Volver al carrito
      </button>

      <h1 className={styles.title}>Checkout</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fields}>
          {/* Datos del cliente */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Datos de contacto</legend>

            <label className={styles.field}>
              <span className={styles.label}>Nombre *</span>
              <input
                className={styles.input}
                name="name"
                value={values.name}
                onChange={handleChange}
                placeholder="Tu nombre completo"
              />
              {errors.name ? <span className={styles.error}>{errors.name}</span> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Email *</span>
              <input
                className={styles.input}
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                placeholder="tu@email.com"
              />
              {errors.email ? <span className={styles.error}>{errors.email}</span> : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Dirección *</span>
              <input
                className={styles.input}
                name="address"
                value={values.address}
                onChange={handleChange}
                placeholder="Calle, número, ciudad"
              />
              {errors.address ? <span className={styles.error}>{errors.address}</span> : null}
            </label>
          </fieldset>

          {/* Envío */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Método de envío</legend>
            {SHIPPING_OPTIONS.map((option) => (
              <label key={option.id} className={styles.radioOption}>
                <input
                  type="radio"
                  name="shipping"
                  value={option.id}
                  checked={values.shipping === option.id}
                  onChange={handleChange}
                />
                {option.label} — ${option.price}
              </label>
            ))}
          </fieldset>

          {/* Pago */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Método de pago</legend>
            {PAYMENT_OPTIONS.map((option) => (
              <label key={option.id} className={styles.radioOption}>
                <input
                  type="radio"
                  name="payment"
                  value={option.id}
                  checked={values.payment === option.id}
                  onChange={handleChange}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        </div>

        {/* Resumen lateral */}
        <div className={styles.summary}>
          <p className={styles.summaryTitle}>Resumen del pedido</p>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>IVA (19%)</span>
            <span>${totals.tax.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Envío</span>
            <span>${totals.shipping.toFixed(2)}</span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
          <button type="submit" className={styles.btnConfirm}>
            Confirmar compra →
          </button>
        </div>
      </form>
    </section>
  );
}

export default Checkout;