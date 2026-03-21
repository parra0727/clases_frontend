import { useMemo, useState } from 'react';

import { loadProducts } from '../utils/productStorage';
import styles from '../styles/Home.module.css';

function Home({ onOpenCategory }) {
  const [productsState] = useState(() => loadProducts());

  const categoryTiles = useMemo(() => {
    const map = new Map();

    for (const product of productsState) {
      const existing = map.get(product.category);
      if (!existing || product.rating > existing.rating) {
        map.set(product.category, product);
      }
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, product]) => ({ category, product }));
  }, [productsState]);

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Bienvenido</h1>
        <p className={styles.subtitle}>Explorá nuestras categorías de productos.</p>
      </header>

      <div className={styles.grid}>
        {categoryTiles.map(({ category, product }) => (
          <article key={category} className={styles.card}>
            <div className={styles.imageWrapper}>
              <img src={product.image} alt={category} className={styles.image} />
              <div className={styles.overlay} />
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.categoryName}>{category}</h2>
              <button
                type="button"
                className={styles.btnCategory}
                onClick={() => onOpenCategory(category)}
              >
                Ver categoría →
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Home;