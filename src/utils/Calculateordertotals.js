export const SHIPPING_OPTIONS = [
  { id: 'standard', label: 'Envío estándar (5-7 días)', price: 10 },
  { id: 'express', label: 'Envío express (1-2 días)', price: 25 },
  { id: 'pickup', label: 'Retiro en tienda', price: 0 },
];

export const PAYMENT_OPTIONS = [
  { id: 'credit', label: 'Tarjeta de crédito' },
  { id: 'debit', label: 'Tarjeta de débito' },
  { id: 'transfer', label: 'Transferencia bancaria' },
];

export const TAX_RATE = 0.19;

export function calculateCartSubtotal(cartItems) {
  return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

export function calculateOrderTotals(cartItems, shippingId) {
  const subtotal = calculateCartSubtotal(cartItems);
  const shipping = SHIPPING_OPTIONS.find((o) => o.id === shippingId)?.price ?? 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + shipping;

  return { subtotal, tax, shipping, total };
}