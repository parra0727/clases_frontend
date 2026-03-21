import { useMemo, useState } from 'react';

import ProductCard from '../components/ProductCard';
import ProductDetailsModal from '../components/ProductDetailsModal';
import { loadProducts } from '../utils/productStorage';
import styles from '../styles/CategoryProducts.module.css';

function CategoryProducts({ category, onBack, cartItems, onAddToCart }) {
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const productsState = useMemo(() => loadProducts(), []);

  const cartQuantityById = useMemo(() => {
    const map = new Map();
    for (const item of cartItems ?? []) {
      map.set(item.id, item.quantity);
    }
    return map;
  }, [cartItems]);

  const filteredProducts = useMemo(() => {
    if (!category) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return productsState.filter((product) => {
      if (product.category !== category) return false;
      if (!normalizedQuery) return true;
      return product.name.toLowerCase().includes(normalizedQuery);
    });
  }, [productsState, category, query]);

  const handleOpenDetails = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  return (
    <section className={styles.container}>
      <button type="button" className={styles.btnBack} onClick={onBack}>
        ← Volver
      </button>

      <h1 className={styles.title}>{category}</h1>

      <input
        type="search"
        className={styles.searchInput}
        placeholder="Buscar por nombre..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filteredProducts.length === 0 ? (
        <p className={styles.empty}>No se encontraron productos.</p>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map((product) => {
            const quantityInCart = cartQuantityById.get(product.id) ?? 0;
            const isAtStock = quantityInCart >= product.stock;

            return (
              <ProductCard
                key={product.id}
                name={product.name}
                category={product.category}
                price={product.price}
                rating={product.rating}
                stock={product.stock}
                image={product.image}
                description={product.description}
                onDetails={() => handleOpenDetails(product)}
                onAddToCart={onAddToCart ? () => onAddToCart(product) : undefined}
                disableAddToCart={isAtStock}
              />
            );
          })}
        </div>
      )}

      <ProductDetailsModal
        isOpen={isModalOpen}
        product={selectedProduct}
        onClose={handleCloseDetails}
      />
    </section>
  );
}

export default CategoryProducts;