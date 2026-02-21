import { useState } from 'react';
import styles from '../styles/ProductCard.module.css';
 
function ProductCard({name, price, description, image, category, stock}) {
    const{likes,setLikes} = useState(0);
    const{isLiked,setIsLiked} = useState(false);

    const hanleLike = () => {
        if (isLiked){
            setLikes(likes -1);
            setIsLiked(false);
        } else{
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
            <p className={styles.productStock}>stock: {stock}</p>
            <p className={styles.productDescription}>{description}</p>
            <div className={styles.productFooter}>
            <span className={styles.productPrice}>${price.toFixed(2)}</span>
            <button
                    className = {`${styles.btnLike} ${isLiked ? styles.liked : ''}`}
                    onClick = { hanleLike }
                    >
                        { isLiked ? '❤️' : '🤍' } { likes } Me gusta
            </button>
            </div>
        </div>
    </article>
)
}
 
export default ProductCard;