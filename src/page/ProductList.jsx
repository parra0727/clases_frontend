import { useEffect, useState } from 'react';

import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import styles from '../styles/ProductList.module.css';
import ProductDetailsModal from '../components/ProductDetailsModal';
import { loadProducts, PRODUCTS_STORAGE_KEY } from '../utils/productStorage';

const STORAGE_KEY = PRODUCTS_STORAGE_KEY;

function ProductList() {
  const [productsState, setProductsState] = useState(loadProducts);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(productsState));
    } catch (error) {
      void error;
    }
  }, [productsState]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  const handleAddProduct = (product) => {
    setProductsState((prev) => {
      const maxId = prev.reduce((acc, item) => Math.max(acc, item.id), 0);
      const nextId = maxId + 1;

      return [...prev, { ...product, id: nextId }];
    });

    handleCloseForm();
  };

  const handleDeleteProduct = (id) => {
    setProductsState((prev) => prev.filter((product) => product.id !== id));

    if (editingProduct?.id === id) {
      handleCloseForm();
    }
  };

  const handleEditStart = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleEditSubmit = (updatedProduct) => {
    setProductsState((prev) =>
      prev.map((product) => (product.id === updatedProduct.id ? updatedProduct : product))
    );
    handleCloseForm();
  };
  const handleDetailsOpen = (product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  }
  const handleDetailsClose = () => {
    setSelectedProduct(null);
    setIsDetailsOpen(false);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Productos Informáticos</h1>
        <p className={styles.subtitle}>
          Encuentra los mejores productos de tecnología para tu setup
        </p>
      </header>

      {isFormOpen ? (
        <ProductForm
          initialValues={editingProduct}
          isEditing={Boolean(editingProduct)}
          onCancel={handleCloseForm}
          onSubmit={editingProduct ? handleEditSubmit : handleAddProduct}
        />
      ) : (
        <>
          <div className={styles.toolbar}>
            <button className={styles.btnAdd} type="button" onClick={handleOpenCreate}>
              Agregar producto
            </button>
          </div>

          <div className={styles.grid}>
            {productsState.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                category={product.category}
                price={product.price}
                rating={product.rating}
                stock={product.stock}
                image={product.image}
                description={product.description}
                onDetails={() => handleDetailsOpen(product)}
                onDelete={() => handleDeleteProduct(product.id)}
                onEdit={() => handleEditStart(product)}
              />
            ))}
          </div>
        </>
      )}
        <ProductDetailsModal
            isOpen={isDetailsOpen}
            product={selectedProduct}
            onClose={handleDetailsClose}
          />
    </div>
  );
}

export default ProductList;
