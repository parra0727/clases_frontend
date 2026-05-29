import { products as seedProducts } from '../data/products';

const STORAGE_KEY = 'products';
const DEFAULT_RATING = 3;

const seedById = new Map(seedProducts.map((product) => [product.id, product]));

const categoryIds = new Map();

const getCategoryId = (categoryName, fallbackId) => {
  const normalizedCategoryName = String(categoryName ?? '').trim();

  if (Number.isFinite(Number(fallbackId)) && Number(fallbackId) > 0) {
    return Number(fallbackId);
  }

  if (!normalizedCategoryName) {
    return 0;
  }

  if (!categoryIds.has(normalizedCategoryName)) {
    categoryIds.set(normalizedCategoryName, categoryIds.size + 1);
  }

  return categoryIds.get(normalizedCategoryName);
};

const clampRating = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_RATING;
  return Math.min(5, Math.max(1, parsed));
};

const normalizeStockQty = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
};

const buildSku = (product, fallbackId) => {
  const currentSku = String(product?.sku ?? '').trim();

  if (currentSku) {
    return currentSku;
  }

  const categoryName = String(product?.categoryName ?? product?.category ?? 'GEN').trim();
  const categoryPrefix = categoryName.slice(0, 3).toUpperCase() || 'GEN';
  const numericId = Number(fallbackId ?? product?.id ?? 0);
  const normalizedId = Number.isFinite(numericId) && numericId > 0 ? numericId : 0;

  return `${categoryPrefix}-${String(normalizedId).padStart(3, '0')}`;
};

const normalizeProduct = (product, { seedFallback = true } = {}) => {
  const seedProduct = seedFallback ? seedById.get(product?.id) : null;
  const mergedProduct = {
    ...(seedProduct ?? {}),
    ...product,
  };
  const categoryName =
    String(mergedProduct?.categoryName ?? mergedProduct?.category ?? 'Sin categoría').trim() ||
    'Sin categoría';
  const stockQty = normalizeStockQty(mergedProduct?.stockQty ?? mergedProduct?.stock);
  const isActive = mergedProduct?.isActive ?? true;
  const normalizedId = Number(mergedProduct?.id ?? seedProduct?.id ?? 0);

  return {
    ...mergedProduct,
    id: normalizedId,
    categoryId: getCategoryId(categoryName, mergedProduct?.categoryId),
    categoryName,
    category: categoryName,
    sku: buildSku(mergedProduct, normalizedId),
    rating: clampRating(mergedProduct?.rating ?? DEFAULT_RATING),
    stockQty,
    stock: stockQty,
    isActive: Boolean(isActive),
    isAvailable: Boolean((mergedProduct?.isAvailable ?? stockQty > 0) && isActive),
    createdAt: String(mergedProduct?.createdAt ?? seedProduct?.createdAt ?? ''),
    updatedAt: String(mergedProduct?.updatedAt ?? ''),
  };
};

const normalizeProducts = (products, options = {}) => {
  if (!Array.isArray(products)) {
    return options.seedFallback === false ? [] : seedProducts;
  }

  return products
    .map((product) => normalizeProduct(product, options))
    .filter((product) => product.id > 0);
};

export function loadProducts(options = {}) {
  if (typeof window === 'undefined') {
    return options.seedFallback === false ? [] : seedProducts;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return options.seedFallback === false ? [] : seedProducts;
  }

  try {
    const parsed = JSON.parse(stored);
    return normalizeProducts(parsed, options);
  } catch {
    return options.seedFallback === false ? [] : seedProducts;
  }
}

export function saveProducts(products, options = {}) {
  const normalizedProducts = normalizeProducts(products, options);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedProducts));
  }

  return normalizedProducts;
}

export const PRODUCTS_STORAGE_KEY = STORAGE_KEY;
export const PRODUCTS_DEFAULT_RATING = DEFAULT_RATING;
