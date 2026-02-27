import { useState } from "react";
import styles from "../styles/ProductCard.module.css";

function ProductCard({ name, price, description, image, category, stock, onEdit, onDelete }) {
  // ✅ Fix: desestructuración correcta con [] no {}
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    if (isLiked) {
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      setLikes(likes + 1);
      setIsLiked(true);
    }
  };

  return (
    <article className={styles.productCard}>
      <img src={image} alt={name} className={styles.productImage} />

      <div className={styles.productInfo}>
        <span className={styles.productCategory}>{category}</span>
        <h3 className={styles.productName}>{name}</h3>
        <p className={styles.productStock}>Stock: {stock}</p>
        <p className={styles.productDescription}>{description}</p>

        <div className={styles.productFooter}>
          <span className={styles.productPrice}>${price.toLocaleString("es-CL")}</span>
          <button
            className={`${styles.btnLike} ${isLiked ? styles.liked : ""}`}
            onClick={handleLike}
            type="button"
          >
            {isLiked ? "❤️" : "🤍"} {likes}
          </button>
        </div>
      </div>

      {/* Botones Editar / Eliminar — opcionales */}
      {(onEdit || onDelete) && (
        <div className={styles.cardActions}>
          {onEdit && (
            <button type="button" className={styles.btnEdit} onClick={onEdit}>
              ✏️ Editar
            </button>
          )}
          {onDelete && (
            <button type="button" className={styles.btnDelete} onClick={onDelete}>
              🗑️ Eliminar
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default ProductCard;