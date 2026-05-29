import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import OptionalImage from '../components/OptionalImage';
import useAuth from '../hooks/useAuth';
import orderService from '../services/orderService';
import styles from '../styles/OrderDetail.module.css';
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

function OrderDetail() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const nextOrder = await orderService.getOrderByIdForUserAsync(currentUser?.id, orderId);

        if (isMounted) {
          setOrder(nextOrder);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error && error.message
              ? error.message
              : 'No fue posible cargar el detalle de la orden.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, orderId]);

  if (isLoading) {
    return (
      <section className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.eyebrow}>Semana 14</p>
          <h1 className={styles.title}>Detalle de orden</h1>
          <p className={styles.subtitle}>Cargando información de la orden solicitada...</p>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.eyebrow}>Semana 14</p>
          <h1 className={styles.title}>Detalle de orden</h1>
          <p className={styles.subtitle}>{loadError}</p>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.eyebrow}>Semana 11</p>
          <h1 className={styles.title}>Orden no encontrada</h1>
          <p className={styles.subtitle}>
            El identificador solicitado no pertenece al usuario autenticado o ya no está disponible
            en este navegador.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => navigate('/user/orders')}
            >
              Volver al historial
            </button>
            <button type="button" className={styles.primaryButton} onClick={() => navigate('/')}>
              Ir al inicio
            </button>
          </div>
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
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Semana 11</p>
          <h1 className={styles.title}>Detalle de orden</h1>
          <p className={styles.subtitle}>
            Consulta el pedido completo, con los datos del cliente, envio, pago y totales.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => navigate('/user/orders')}
          >
            Volver al historial
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => navigate('/user/profile')}
          >
            Mi perfil
          </button>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.label}>Orden</span>
          <strong>{order.orderNumber || order.id}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.label}>Fecha</span>
          <strong>{formattedDate}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.label}>Estado</span>
          <strong>{order.status}</strong>
        </div>
        {hasCartId ? (
          <div className={styles.summaryCard}>
            <span className={styles.label}>Cart ID</span>
            <strong>{order.cartId}</strong>
          </div>
        ) : null}
      </div>

      <div className={styles.layout}>
        <section className={styles.card}>
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

        <section className={styles.card}>
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
              <span>Envio</span>
              <strong>{formatCOP(order.totals?.shipping ?? 0)}</strong>
            </div>
            <div className={`${styles.totalRow} ${styles.totalRowStrong}`}>
              <span>Total</span>
              <strong>{formatCOP(order.totals?.total ?? 0)}</strong>
            </div>
          </div>
        </section>

        <section className={styles.card}>
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
      </div>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Productos</h2>
        <div className={styles.itemList}>
          {order.items.map((item) => (
            <article key={`${order.id}-${item.id}`} className={styles.item}>
              <OptionalImage className={styles.itemImage} src={item.image} alt={item.name} />
              <div className={styles.itemContent}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <p className={styles.itemMeta}>Categoria: {item.category}</p>
                {item.sku ? <p className={styles.itemMeta}>SKU: {item.sku}</p> : null}
                <p className={styles.itemMeta}>Cantidad: {item.quantity}</p>
              </div>
              <strong className={styles.itemPrice}>
                {formatCOP(item.lineTotal ?? (item.unitPrice ?? item.price) * item.quantity)}
              </strong>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default OrderDetail;
