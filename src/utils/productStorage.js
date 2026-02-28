import { products as seedProducts } from '../data/products';

const STORAGE_KEY = 'products';
const DEFAULT_RATING = 3;

const seedById = new Map(seedProducts.map((product) => [product.id, product]));

const clampRating = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_RATING;
  return Math.min(5, Math.max(1, parsed));
};

const normalizeProduct = (product) => {
  const seedProduct = seedById.get(product?.id);

  return {
    ...seedProduct,
    ...product,
    rating: clampRating(product?.rating ?? seedProduct?.rating ?? DEFAULT_RATING),
  };
};

export function loadProducts() {
  if (typeof window === 'undefined') {
    return seedProducts;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return seedProducts;
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(normalizeProduct) : seedProducts;
  } catch {
    return seedProducts;
  }
}

export const PRODUCTS_STORAGE_KEY = STORAGE_KEY;
export const PRODUCTS_DEFAULT_RATING = DEFAULT_RATING;