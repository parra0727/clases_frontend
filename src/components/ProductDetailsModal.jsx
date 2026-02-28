import { useEffect } from 'react';

import styles from '../styles/ProductDetailsModal.module.css';

function ProductDetailsModal({ isOpen, product, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) {
    return null;
  }

  const ratingValue = Number(product.rating);
  const rating = Number.isFinite(ratingValue) ? ratingValue : null;

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${product.name}`}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.category}>{product.category}</p>
            <h2 className={styles.title}>{product.name}</h2>
          </div>

          <button type="button" className={styles.btnClose} onClick={onClose}>
            Cerrar
          </button>
        </header>

        <div className={styles.content}>
          <img className={styles.image} src={product.image} alt={product.name} />

          <div className={styles.details}>
            <p className={styles.description}>{product.description}</p>

            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Precio</span>
                <span className={styles.metaValue}>{product.price}</span>
              </div>

              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Stock</span>
                <span className={styles.metaValue}>{product.stock}</span>
              </div>

              {rating !== null ? (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Calificación</span>
                  <span className={styles.metaValue}>{rating}/5</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsModal;