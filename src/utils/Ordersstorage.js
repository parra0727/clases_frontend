const STORAGE_KEY = 'orders';

const normalizeOrder = (order) => ({
  id: order?.id ?? crypto.randomUUID(),
  date: order?.date ?? new Date().toISOString(),
  customer: order?.customer ?? {},
  items: Array.isArray(order?.items) ? order.items : [],
  totals: order?.totals ?? {},
  shipping: order?.shipping ?? null,
  payment: order?.payment ?? null,
});

export function loadOrders() {
  if (typeof window === 'undefined') return [];

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(normalizeOrder) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order) {
  const orders = loadOrders();
  const normalized = normalizeOrder(order);
  const updated = [...orders, normalized];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    void error;
  }

  return normalized;
}

export const ORDERS_STORAGE_KEY = STORAGE_KEY;