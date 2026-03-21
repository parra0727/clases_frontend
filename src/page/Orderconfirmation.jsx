import styles from '../styles/OrderConfirmation.module.css';

function OrderConfirmation({ order, onBackHome }) {
  if (!order) {
    return (
      <section className={styles.container}>
        <h1 className={styles.title}>Sin orden</h1>
        <p className={styles.subtitle}>No hay una orden confirmada para mostrar.</p>
        <button type="button" className={styles.btnHome} onClick={onBackHome}>
          Volver al inicio
        </button>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <div className={styles.icon}>✅</div>
      <h1 className={styles.title}>¡Compra confirmada!</h1>
      <p className={styles.subtitle}>
        Gracias, {order.customer.name}. Tu pedido fue registrado exitosamente.
      </p>

      {/* Datos del cliente */}
      <div className={styles.card}>
        <p className={styles.cardTitle}>Datos de envío</p>
        <div className={styles.infoRow}>
          <span>Email</span>
          <span>{order.customer.email}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Dirección</span>
          <span>{order.customer.address}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Envío</span>
          <span>{order.shipping?.label}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Pago</span>
          <span>{order.payment?.label}</span>
        </div>
      </div>

      {/* Productos */}
      <div className={styles.card}>
        <p className={styles.cardTitle}>Productos</p>
        <div className={styles.itemList}>
          {order.items.map((item) => (
            <div key={item.id} className={styles.item}>
              <span>{item.name} x{item.quantity}</span>
              <span>${item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totales */}
      <div className={styles.card}>
        <p className={styles.cardTitle}>Resumen</p>
        <div className={styles.infoRow}>
          <span>Subtotal</span>
          <span>${order.totals.subtotal?.toFixed(2)}</span>
        </div>
        <div className={styles.infoRow}>
          <span>IVA (19%)</span>
          <span>${order.totals.tax?.toFixed(2)}</span>
        </div>
        <div className={styles.infoRow}>
          <span>Envío</span>
          <span>${order.totals.shipping?.toFixed(2)}</span>
        </div>
        <div className={styles.totalRow}>
          <span>Total</span>
          <span>${order.totals.total?.toFixed(2)}</span>
        </div>
      </div>

      <button type="button" className={styles.btnHome} onClick={onBackHome}>
        Volver al inicio →
      </button>
    </section>
  );
}

export default OrderConfirmation;