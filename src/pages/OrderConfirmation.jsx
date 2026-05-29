import { useNavigate } from 'react-router-dom';

import OptionalImage from '../components/OptionalImage';
import { appConfig } from '../config';
import styles from '../styles/OrderConfirmation.module.css';
import { formatCOP } from '../utils/formatCOP';

const formatAddressLines = (address) => {
  if (!address) {
    return [];
  }

  return [
    address.line1,
    address.line2,
    [address.city, address.state].filter(Boolean).join(', '),
    [address.country, address.postalCode].filter(Boolean).join(' - '),
  ].filter(Boolean);
};

function OrderConfirmation({ order, onBackHome }) {
  const navigate = useNavigate();
  const isRemoteMode = appConfig.useRemoteApi;

  const handleBackHome = () => {
    onBackHome();
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/user/orders');
  };

  if (!order) {
    return (
      <section className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>No hay una orden reciente</h1>
          <p className={styles.subtitle}>
            El checkout ya se cerró o no existe una compra para mostrar en esta vista.
          </p>
          <button type="button" className={styles.primaryButton} onClick={handleBackHome}>
            Volver al inicio
          </button>
        </div>
      </section>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const hasCartId = Boolean(String(order.cartId ?? '').trim());
  const shippingAddressLines = formatAddressLines(order.shippingAddress);
  const billingAddressLines = formatAddressLines(order.billingAddress);

  return (
    <section className={styles.container}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Compra confirmada</p>
        <h1 className={styles.title}>Tu pedido quedó registrado</h1>
        <p className={styles.subtitle}>
          {isRemoteMode
            ? 'Guarda este resumen para seguimiento. El carrito ya se vació y la orden quedó registrada en el backend.'
            : 'Guarda este resumen para seguimiento. El carrito ya se vació y la orden quedó persistida localmente.'}
        </p>

        <div className={styles.metaGrid}>
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Orden</span>
            <strong className={styles.metaValue}>{order.orderNumber || order.id}</strong>
          </div>
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Fecha</span>
            <strong className={styles.metaValue}>{formattedDate}</strong>
          </div>
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Estado</span>
            <strong className={styles.metaValue}>{order.status}</strong>
          </div>
          {hasCartId ? (
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Cart ID</span>
              <strong className={styles.metaValue}>{order.cartId}</strong>
            </div>
          ) : null}
        </div>

        <div className={styles.layout}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Cliente</h2>
            <div className={styles.infoList}>
              <p>
                <strong>{order.customer?.fullName ?? order.userFullName ?? '—'}</strong>
              </p>
              <p>{order.customer?.email ?? order.userEmail ?? '—'}</p>
              <p>{order.customer?.phone ?? '—'}</p>
              {shippingAddressLines.length === 0 ? <p>{order.customer?.address}</p> : null}
              {shippingAddressLines.length === 0 ? (
                <p>
                  {order.customer?.city} - {order.customer?.postalCode}
                </p>
              ) : null}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Direcciones</h2>
            <div className={styles.infoList}>
              <p>
                <strong>Envío</strong>
              </p>
              {(shippingAddressLines.length > 0
                ? shippingAddressLines
                : ['Sin dirección de envío']
              ).map((line) => (
                <p key={`shipping-${line}`}>{line}</p>
              ))}
              <p>
                <strong>Facturación</strong>
              </p>
              {(billingAddressLines.length > 0
                ? billingAddressLines
                : ['Sin dirección de facturación']
              ).map((line) => (
                <p key={`billing-${line}`}>{line}</p>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Items</h2>
            <div className={styles.itemList}>
              {order.items.map((item) => (
                <article key={item.id} className={styles.item}>
                  <OptionalImage className={styles.itemImage} src={item.image} alt={item.name} />
                  <div className={styles.itemContent}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemMeta}>
                      {item.quantity} x {formatCOP(item.unitPrice ?? item.price)}
                    </p>
                  </div>
                  <strong className={styles.itemPrice}>
                    {formatCOP(item.lineTotal ?? item.quantity * (item.unitPrice ?? item.price))}
                  </strong>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Totales</h2>
          <div className={styles.totalRows}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <strong>{formatCOP(order.totals?.subtotal ?? 0)}</strong>
            </div>
            <div className={styles.totalRow}>
              <span>IVA</span>
              <strong>{formatCOP(order.totals?.tax ?? 0)}</strong>
            </div>
            <div className={styles.totalRow}>
              <span>Envío</span>
              <strong>{formatCOP(order.totals?.shipping ?? 0)}</strong>
            </div>
            <div className={`${styles.totalRow} ${styles.totalRowStrong}`}>
              <span>Total final</span>
              <strong>{formatCOP(order.totals?.total ?? 0)}</strong>
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={handleViewOrders}>
            Ver historial
          </button>
          <button type="button" className={styles.primaryButton} onClick={handleBackHome}>
            Volver al inicio
          </button>
        </div>
      </div>
    </section>
  );
}

export default OrderConfirmation;
