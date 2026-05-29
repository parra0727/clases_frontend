import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import categoryService from '../services/categoryService';
import productService from '../services/productService';
import adminStyles from '../styles/AdminProducts.module.css';
import productListStyles from '../styles/ProductList.module.css';

function AdminProducts() {
  const navigate = useNavigate();
  const [categoriesState, setCategoriesState] = useState([]);
  const [productsState, setProductsState] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const [nextProducts, nextCategories] = await Promise.all([
          productService.getAdminProductsAsync(),
          categoryService.getCategoriesAsync(),
        ]);

        if (isMounted) {
          setProductsState(nextProducts);
          setCategoriesState(nextCategories);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error && error.message
              ? error.message
              : 'No fue posible cargar los productos del panel admin.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return productsState.filter((product) => {
      if (!normalizedQuery) {
        return true;
      }

      return [product.name, product.categoryName ?? product.category, product.description].some(
        (field) =>
          String(field ?? '')
            .toLowerCase()
            .includes(normalizedQuery)
      );
    });
  }, [productsState, query]);

  const handleOpenCreate = () => {
    setSubmitError('');
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSubmitError('');
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  const handleAddProduct = async (product) => {
    setIsSaving(true);
    setSubmitError('');

    try {
      const nextProducts = await productService.createProductAsync(product, productsState);
      setProductsState(nextProducts);
      handleCloseForm();
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'No fue posible crear el producto.';
      setSubmitError(message);
      return { ok: false, error: message };
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    setSubmitError('');

    try {
      const nextProducts = await productService.deleteProductAsync(productId, productsState);
      setProductsState(nextProducts);
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : 'No fue posible eliminar el producto seleccionado.'
      );
    }

    if (editingProduct?.id === productId) {
      handleCloseForm();
    }
  };

  const handleToggleProductStatus = async (productId, isActive) => {
    setSubmitError('');

    try {
      const nextProducts = await productService.toggleProductStatusAsync(productId, isActive);
      setProductsState(nextProducts);
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : 'No fue posible cambiar el estado del producto.'
      );
    }
  };

  const handleEditStart = (product) => {
    setSubmitError('');
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleEditSubmit = async (updatedProduct) => {
    setIsSaving(true);
    setSubmitError('');

    try {
      const nextProducts = await productService.updateProductAsync(updatedProduct, productsState);
      setProductsState(nextProducts);
      handleCloseForm();
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'No fue posible actualizar el producto.';
      setSubmitError(message);
      return { ok: false, error: message };
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={adminStyles.container}>
      <header className={adminStyles.header}>
        <div>
          <p className={adminStyles.eyebrow}>Semana 12</p>
          <h1 className={adminStyles.title}>Gestión de productos</h1>
          <p className={adminStyles.subtitle}>
            Solo los administradores pueden crear, editar y eliminar productos del catálogo.
          </p>
        </div>

        <div className={adminStyles.actions}>
          <button
            type="button"
            className={adminStyles.secondaryButton}
            onClick={() => navigate('/admin')}
          >
            Volver al panel
          </button>
          <button
            type="button"
            className={adminStyles.primaryButton}
            onClick={() => navigate('/products')}
          >
            Ver catálogo público
          </button>
        </div>
      </header>

      {isFormOpen ? (
        <ProductForm
          categories={categoriesState}
          initialValues={editingProduct}
          isEditing={Boolean(editingProduct)}
          isSubmitting={isSaving}
          onCancel={handleCloseForm}
          onSubmit={editingProduct ? handleEditSubmit : handleAddProduct}
          submitError={submitError}
        />
      ) : (
        <>
          <div className={productListStyles.toolbar}>
            <div className={productListStyles.filters}>
              <input
                className={productListStyles.searchInput}
                disabled={isLoading}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, categoría o descripción..."
                type="search"
              />
            </div>

            <button
              className={productListStyles.btnAdd}
              type="button"
              onClick={handleOpenCreate}
              disabled={isLoading}
            >
              Agregar producto
            </button>
          </div>

          {submitError ? (
            <div className={productListStyles.emptyState}>
              <p>{submitError}</p>
            </div>
          ) : null}

          {isLoading ? (
            <div className={productListStyles.emptyState}>
              <p>Cargando productos del panel admin...</p>
            </div>
          ) : loadError ? (
            <div className={productListStyles.emptyState}>
              <p>{loadError}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={productListStyles.emptyState}>
              <p>No hay productos que coincidan con la búsqueda actual.</p>
            </div>
          ) : (
            <div className={productListStyles.grid}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  category={product.category}
                  categoryName={product.categoryName}
                  price={product.price}
                  rating={product.rating}
                  stock={product.stock}
                  stockQty={product.stockQty}
                  isActive={product.isActive}
                  isAvailable={product.isAvailable}
                  image={product.image}
                  description={product.description}
                  onEdit={() => handleEditStart(product)}
                  onToggleStatus={handleToggleProductStatus}
                  onDelete={() => handleDeleteProduct(product.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AdminProducts;
