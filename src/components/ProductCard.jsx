import { useState } from 'react';

import styles from '../styles/ProductCard.module.css';
import { formatCOP } from '../utils/formatCOP';

import OptionalImage from './OptionalImage';

function ProductCard({
  id,
  name,
  category,
  categoryName,
  price,
  stock,
  stockQty,
  image,
  description,
  rating,
  isActive = true,
  isAvailable = true,
  onAddToCart,
  onDetails,
  onEdit,
  onDelete,
  onToggleStatus,
  disableAddToCart = false,
}) {
  const [likeState, setLikeState] = useState({ liked: false, count: 0 });
  const productCategory = categoryName ?? category;
  const productStock = Number.isFinite(Number(stockQty)) ? Number(stockQty) : stock;
  const cannotAddToCart =
    disableAddToCart || !isActive || !isAvailable || Number(productStock) <= 0;

  const handleLike = () => {
    setLikeState((prev) => ({
      liked: !prev.liked,
      count: prev.liked ? prev.count - 1 : prev.count + 1,
    }));
  };

  return (
    <article className={`${styles.productCard} ${!isActive ? styles.productCardInactive : ''}`}>
      <OptionalImage src={image} alt={name} className={styles.productImage} />
      <div className={styles.productInfo}>
        {!isActive && <span className={styles.inactiveBadge}>Inactivo</span>}
        <span className={styles.productCategory}>{productCategory}</span>
        <h3 className={styles.productName}>{name}</h3>
        {Number.isFinite(Number(rating)) ? (
          <p className={styles.productRating}>Calificación: {Number(rating)}/5</p>
        ) : null}
        <p className={styles.productDescription}>{description}</p>
        <p className={styles.productStock}>Stock: {productStock}</p>
        <div className={styles.productFooter}>
          <span className={styles.productPrice}>{formatCOP(price)}</span>
          <button
            type="button"
            className={`${styles.btnLike} ${likeState.liked ? styles.liked : ''}`}
            onClick={handleLike}
          >
            {likeState.liked ? '❤️' : '🤍'} {likeState.count} Me gusta
          </button>
        </div>

        {onAddToCart || onDetails || onEdit || onDelete || onToggleStatus ? (
          <div className={styles.cardActions}>
            {onAddToCart ? (
              <button
                type="button"
                className={styles.btnAddToCart}
                onClick={() =>
                  onAddToCart({
                    id,
                    name,
                    category: productCategory,
                    categoryName: productCategory,
                    price,
                    stock: productStock,
                    stockQty: productStock,
                    image,
                  })
                }
                disabled={cannotAddToCart}
              >
                {cannotAddToCart ? 'No disponible' : 'Agregar al carrito'}
              </button>
            ) : null}

            {onDetails ? (
              <button type="button" className={styles.btnDetails} onClick={onDetails}>
                Más información
              </button>
            ) : null}

            {onEdit ? (
              <button type="button" className={styles.btnEdit} onClick={onEdit}>
                Editar
              </button>
            ) : null}

            {onToggleStatus ? (
              <button
                type="button"
                className={isActive ? styles.btnDeactivate : styles.btnActivate}
                onClick={() => onToggleStatus(id, !isActive)}
              >
                {isActive ? 'Desactivar' : 'Activar'}
              </button>
            ) : null}

            {onDelete ? (
              <button type="button" className={styles.btnDelete} onClick={onDelete}>
                {onToggleStatus ? 'Eliminar permanente' : 'Eliminar'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default ProductCard;
