import { useEffect, useState } from "react";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";
import ProductForm from "../components/ProductForm";
import styles from "../styles/ProductList.module.css";

const STORAGE_KEY = "products";

function ProductList() {
  // ✅ Paso 9.1 — Carga inicial desde localStorage (lazy)
  const [productsState, setProductsState] = useState(() => {
    if (typeof window === "undefined") return products;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return products;
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : products;
    } catch {
      return products;
    }
  });

  // Estado del modal y edición
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // ✅ Paso 9.2 — Persistir en localStorage cada vez que cambie el estado
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(productsState));
    } catch (error) {
      void error;
    }
  }, [productsState]);

  // ─── Handlers ───────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  // ✅ Paso 4 — Agregar producto
  const handleAddProduct = (product) => {
    setProductsState((prev) => {
      const maxId = prev.reduce((acc, item) => Math.max(acc, item.id), 0);
      const nextId = maxId + 1;
      return [...prev, { ...product, id: nextId }];
    });
    handleCloseForm();
  };

  // ✅ Paso 5 — Eliminar producto
  const handleDeleteProduct = (id) => {
    setProductsState((prev) => prev.filter((p) => p.id !== id));
  };

  // ✅ Paso 6 — Editar: abrir modal con datos precargados
  const handleEditStart = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  // ✅ Paso 6 — Editar: guardar cambios
  const handleEditSubmit = (updatedProduct) => {
    setProductsState((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    handleCloseForm();
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Lista de <span>Productos</span>
        </h1>
        <p className={styles.subtitle}>
          Explorá nuestra selección · {productsState.length} productos
        </p>
      </header>

      {/* Toolbar con botón Agregar */}
      <div className={styles.toolbar}>
        <button
          className={styles.btnAdd}
          type="button"
          onClick={handleOpenCreate}
        >
          + Agregar producto
        </button>
      </div>

      {/* Grid de productos */}
      <div className={styles.grid}>
        {productsState.length === 0 && (
          <div className={styles.emptyState}>
            <p>No hay productos todavía. ¡Agregá el primero!</p>
          </div>
        )}
        {productsState.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            category={product.category}
            stock={product.stock}
            price={product.price}
            image={product.image}
            description={product.description}
            onDelete={() => handleDeleteProduct(product.id)}
            onEdit={() => handleEditStart(product)}
          />
        ))}
      </div>

      {/* ✅ Paso 8 — Modal del formulario (overlay) */}
      {isFormOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseForm}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <ProductForm
              initialValues={editingProduct}
              isEditing={Boolean(editingProduct)}
              onCancel={handleCloseForm}
              onSubmit={editingProduct ? handleEditSubmit : handleAddProduct}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;