import { products as seedProducts } from '../data/products';

const STORAGE_KEY = 'cart';
const MIN_QUANTITY = 1;

const seedById = new Map(seedProducts.map((p) => [p.id, p]));

const clampQuantity = (value, stock) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < MIN_QUANTITY) return MIN_QUANTITY;
  return Math.min(parsed, stock ?? parsed);
};

const normalizeCartItem = (item) => {
  const seed = seedById.get(item?.id);
  const stock = seed?.stock ?? item?.stock ?? 1;

  return {
    ...seed,
    ...item,
    quantity: clampQuantity(item?.quantity, stock),
  };
};

export function loadCartItems() {
  if (typeof window === 'undefined') return [];

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(normalizeCartItem) : [];
  } catch {
    return [];
  }
}

export const CART_STORAGE_KEY = STORAGE_KEY;