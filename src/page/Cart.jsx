import { useMemo } from 'react';

import styles from '../styles/Cart.module.css';

function Cart({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout }) {
  const { productCount, totalUnits, total } = useMemo(() => {
    const productCount = cartItems.length;
    const totalUnits = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return { productCount, totalUnits, total };
  }, [cartItems]);

  if (cartItems.length === 0) {
    return (
      <section className={styles.container}>
        <h1 className={styles.title}>Carrito</h1>
        <div className={styles.empty}>
          <p>🛒 Tu carrito está vacío.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <h1 className={styles.title}>Carrito</h1>

      <div className={styles.itemList}>
        {cartItems.map((item) => (
          <div key={item.id} className={styles.item}>
            <img src={item.image} alt={item.name} className={styles.itemImage} />

            <div className={styles.itemInfo}>
              <p className={styles.itemName}>{item.name}</p>
              <p className={styles.itemPrice}>Precio unitario: ${item.price}</p>
            </div>

            <div className={styles.quantityControls}>
              <button
                type="button"
                className={styles.btnQty}
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                −
              </button>
              <span className={styles.quantity}>{item.quantity}</span>
              <button
                type="button"
                className={styles.btnQty}
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
              >
                +
              </button>
            </div>

            <span className={styles.itemSubtotal}>${item.price * item.quantity}</span>

            <button
              type="button"
              className={styles.btnRemove}
              onClick={() => onRemoveItem(item.id)}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Productos distintos</span>
          <span>{productCount}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Unidades totales</span>
          <span>{totalUnits}</span>
        </div>
        <div className={styles.summaryTotal}>
          <span>Total</span>
          <span>${total}</span>
        </div>
        <div className={styles.summaryActions}>
          <button type="button" className={styles.btnClear} onClick={onClearCart}>
            Vaciar carrito
          </button>
          <button type="button" className={styles.btnCheckout} onClick={onCheckout}>
            Proceder al checkout →
          </button>
        </div>
      </div>
    </section>
  );
}

export default Cart;