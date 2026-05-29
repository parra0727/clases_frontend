import { appConfig } from '../config';
import { loadSessionToken } from '../utils/authStorage';
import { PRODUCTS_DEFAULT_RATING, loadProducts, saveProducts } from '../utils/productsStorage';

import categoryService from './categoryService';
import { requestJson } from './http';

const REMOTE_STORAGE_OPTIONS = Object.freeze({ seedFallback: false });

const normalizeId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toAsyncResult = (callback) => Promise.resolve().then(callback);

const extractCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.content)) {
    return payload.content;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const loadRemoteProducts = () => loadProducts(REMOTE_STORAGE_OPTIONS);

const persistRemoteProductsCache = (products) => saveProducts(products, REMOTE_STORAGE_OPTIONS);

const normalizeProductInput = (product, currentProducts = []) => {
  const normalizedId = normalizeId(product?.id);
  const existingProduct = currentProducts.find((item) => item.id === normalizedId);
  const categoryName =
    String(
      product?.categoryName ??
        product?.category?.name ??
        product?.category ??
        existingProduct?.categoryName ??
        ''
    ).trim() || 'Sin categoría';
  const categoryId =
    normalizeId(product?.categoryId ?? product?.category?.id ?? existingProduct?.categoryId) ||
    undefined;
  const stockQty = Number(product?.stockQty ?? product?.stock ?? product?.productStock);
  const normalizedStockQty = Number.isFinite(stockQty) && stockQty >= 0 ? Math.floor(stockQty) : 0;
  const price = Number(product?.price ?? existingProduct?.price ?? 0) || 0;
  const isActive = Boolean(
    product?.isActive ?? product?.active ?? existingProduct?.isActive ?? true
  );
  const rating = Number(product?.rating ?? existingProduct?.rating ?? PRODUCTS_DEFAULT_RATING);

  return {
    ...existingProduct,
    ...product,
    id: normalizedId,
    categoryId,
    categoryName,
    category: categoryName,
    sku: String(product?.sku ?? existingProduct?.sku ?? '').trim(),
    price,
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : PRODUCTS_DEFAULT_RATING,
    stockQty: normalizedStockQty,
    stock: normalizedStockQty,
    isActive,
    isAvailable: Boolean((product?.isAvailable ?? normalizedStockQty > 0) && isActive),
    image: String(product?.image ?? product?.imageUrl ?? existingProduct?.image ?? '').trim(),
    description: String(product?.description ?? existingProduct?.description ?? '').trim(),
    createdAt: String(product?.createdAt ?? existingProduct?.createdAt ?? ''),
    updatedAt: String(product?.updatedAt ?? existingProduct?.updatedAt ?? ''),
  };
};

const normalizeRemoteProductInput = (product) => {
  const categoryName =
    String(product?.categoryName ?? product?.category?.name ?? product?.category ?? '').trim() ||
    'Sin categoría';
  const categoryId = normalizeId(product?.categoryId ?? product?.category?.id) || undefined;
  const stockQty = Number(product?.stockQty ?? product?.stock ?? product?.productStock);
  const normalizedStockQty = Number.isFinite(stockQty) && stockQty >= 0 ? Math.floor(stockQty) : 0;
  const price = Number(product?.price ?? 0) || 0;
  const isActive = Boolean(product?.isActive ?? product?.active ?? true);
  const rating = Number(product?.rating ?? PRODUCTS_DEFAULT_RATING);

  return {
    ...product,
    id: normalizeId(product?.id),
    categoryId,
    categoryName,
    category: categoryName,
    sku: String(product?.sku ?? '').trim(),
    price,
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : PRODUCTS_DEFAULT_RATING,
    stockQty: normalizedStockQty,
    stock: normalizedStockQty,
    isActive,
    isAvailable: Boolean((product?.isAvailable ?? normalizedStockQty > 0) && isActive),
    image: String(product?.image ?? product?.imageUrl ?? '').trim(),
    description: String(product?.description ?? '').trim(),
    createdAt: String(product?.createdAt ?? ''),
    updatedAt: String(product?.updatedAt ?? ''),
  };
};

const applyFilters = (products, filters = {}) => {
  const normalizedSearch = String(filters?.search ?? '')
    .trim()
    .toLowerCase();
  const normalizedCategoryId = normalizeId(filters?.categoryId);
  const normalizedCategoryName = String(filters?.categoryName ?? '')
    .trim()
    .toLowerCase();
  const activeOnly = Boolean(filters?.activeOnly);

  return products.filter((product) => {
    const productCategoryName = String(product.categoryName ?? product.category ?? '').trim();
    const matchesSearch =
      !normalizedSearch ||
      [product.name, product.description, product.sku].some((field) =>
        String(field ?? '')
          .toLowerCase()
          .includes(normalizedSearch)
      );
    const matchesCategoryId =
      !normalizedCategoryId || normalizeId(product.categoryId) === normalizedCategoryId;
    const matchesCategoryName =
      !normalizedCategoryName || productCategoryName.toLowerCase() === normalizedCategoryName;
    const matchesActive = !activeOnly || product.isActive !== false;

    return matchesSearch && matchesCategoryId && matchesCategoryName && matchesActive;
  });
};

const persistProducts = (products) => saveProducts(products);

const persistRemoteProducts = (products) => {
  return persistRemoteProductsCache(
    products.map((product) => normalizeRemoteProductInput(product))
  );
};

const buildQueryString = (filters = {}) => {
  const searchParams = new URLSearchParams();

  if (String(filters?.search ?? '').trim()) {
    searchParams.set('search', String(filters.search).trim());
  }

  if (normalizeId(filters?.categoryId) > 0) {
    searchParams.set('categoryId', String(normalizeId(filters.categoryId)));
  }

  if (typeof filters?.activeOnly === 'boolean') {
    searchParams.set('activeOnly', String(filters.activeOnly));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const resolveCategoryId = async (product) => {
  const currentCategoryId = normalizeId(product?.categoryId);

  if (currentCategoryId > 0) {
    return currentCategoryId;
  }

  const categoryName = String(product?.categoryName ?? product?.category ?? '').trim();

  if (!categoryName) {
    return 0;
  }

  const categories = await categoryService.getCategoriesAsync();
  const normalizedCategoryName = categoryName.toLowerCase();
  const match = categories.find(
    (category) =>
      String(category.name ?? '')
        .trim()
        .toLowerCase() === normalizedCategoryName ||
      String(category.slug ?? '')
        .trim()
        .toLowerCase() === normalizedCategoryName
  );

  return normalizeId(match?.id);
};

const buildRemoteAdminPayload = async (product) => {
  const categoryId = await resolveCategoryId(product);

  if (!categoryId) {
    throw new Error('La categoría seleccionada no existe en el backend.');
  }

  return {
    name: String(product?.name ?? '').trim(),
    description: String(product?.description ?? '').trim(),
    price: Number(product?.price) || 0,
    stockQty: Math.max(0, Math.floor(Number(product?.stockQty ?? product?.stock) || 0)),
    image: String(product?.image ?? '').trim(),
    categoryId,
    isActive: Boolean(product?.isActive ?? true),
    ...(String(product?.sku ?? '').trim() ? { sku: String(product.sku).trim() } : {}),
  };
};

function getProducts(filters = {}) {
  return applyFilters(loadProducts(), filters);
}

function getProductById(productId) {
  const normalizedId = normalizeId(productId);
  return loadProducts().find((product) => product.id === normalizedId) ?? null;
}

function createProduct(product, currentProducts = loadProducts()) {
  const maxId = currentProducts.reduce(
    (accumulator, item) => Math.max(accumulator, normalizeId(item.id) || 0),
    0
  );

  return persistProducts([
    ...currentProducts,
    normalizeProductInput({ ...product, id: maxId + 1 }, currentProducts),
  ]);
}

function updateProduct(updatedProduct, currentProducts = loadProducts()) {
  return persistProducts(
    currentProducts.map((product) =>
      product.id === updatedProduct.id
        ? normalizeProductInput({ ...product, ...updatedProduct }, currentProducts)
        : product
    )
  );
}

function deleteProduct(productId, currentProducts = loadProducts()) {
  const normalizedId = normalizeId(productId);
  return persistProducts(currentProducts.filter((product) => product.id !== normalizedId));
}

function getProductsAsync(filters = {}) {
  if (!appConfig.useRemoteApi) {
    return toAsyncResult(() => getProducts(filters));
  }

  return requestJson(`/products${buildQueryString(filters)}`, {
    method: 'GET',
  }).then((response) => applyFilters(persistRemoteProducts(extractCollection(response)), filters));
}

function getAdminProductsAsync() {
  if (!appConfig.useRemoteApi) {
    return toAsyncResult(() => loadProducts());
  }

  return requestJson('/admin/products', {
    method: 'GET',
    token: loadSessionToken(),
  }).then((response) => persistRemoteProducts(extractCollection(response)));
}

function getProductByIdAsync(productId) {
  const normalizedId = normalizeId(productId);

  if (!appConfig.useRemoteApi) {
    return toAsyncResult(() => getProductById(normalizedId));
  }

  return requestJson(`/products/${normalizedId}`, {
    method: 'GET',
  }).then((response) => {
    const normalizedProduct = normalizeRemoteProductInput(response);
    const currentProducts = loadRemoteProducts();
    const nextProducts = currentProducts.some((product) => product.id === normalizedProduct.id)
      ? currentProducts.map((product) =>
          product.id === normalizedProduct.id ? normalizedProduct : product
        )
      : [...currentProducts, normalizedProduct];

    persistRemoteProductsCache(nextProducts);
    return normalizedProduct;
  });
}

function createProductAsync(product, currentProducts = loadProducts()) {
  if (!appConfig.useRemoteApi) {
    return toAsyncResult(() => createProduct(product, currentProducts));
  }

  return buildRemoteAdminPayload(product).then((body) =>
    requestJson('/admin/products', {
      method: 'POST',
      body,
      token: loadSessionToken(),
    }).then(() => getAdminProductsAsync())
  );
}

function updateProductAsync(updatedProduct, currentProducts = loadProducts()) {
  if (!appConfig.useRemoteApi) {
    return toAsyncResult(() => updateProduct(updatedProduct, currentProducts));
  }

  return buildRemoteAdminPayload(updatedProduct).then((body) =>
    requestJson(`/admin/products/${normalizeId(updatedProduct?.id)}`, {
      method: 'PUT',
      body,
      token: loadSessionToken(),
    }).then(() => getAdminProductsAsync())
  );
}

function toggleProductStatusAsync(productId, isActive) {
  const normalizedId = normalizeId(productId);

  if (!appConfig.useRemoteApi) {
    return toAsyncResult(() => {
      const product = getProductById(normalizedId);
      return updateProduct({ ...product, isActive }, []);
    });
  }

  return requestJson(`/admin/products/${normalizedId}`, {
    method: 'PATCH',
    token: loadSessionToken(),
    body: { isActive },
  }).then(() => getAdminProductsAsync());
}

function deleteProductAsync(productId, currentProducts = loadProducts()) {
  const normalizedId = normalizeId(productId);

  if (!appConfig.useRemoteApi) {
    return toAsyncResult(() => deleteProduct(normalizedId, currentProducts));
  }

  return requestJson(`/admin/products/${normalizedId}`, {
    method: 'DELETE',
    token: loadSessionToken(),
  }).then(() => getAdminProductsAsync());
}

const productService = {
  createProduct,
  createProductAsync,
  deleteProduct,
  deleteProductAsync,
  getAdminProductsAsync,
  getProductById,
  getProductByIdAsync,
  getProducts,
  getProductsAsync,
  persistProducts,
  toggleProductStatusAsync,
  updateProduct,
  updateProductAsync,
};

export { productService };
export default productService;
