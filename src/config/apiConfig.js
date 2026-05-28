/**
 * Centraliza todas las rutas de la API del backend.
 *
 * Base URL: definida por VITE_API_BASE_URL en .env (default: /api/v1)
 * Proxy dev:  Vite redirige /api/* → VITE_DEV_PROXY_TARGET (default: http://localhost:8080)
 *
 * Ejemplo real: POST /auth/login  →  fetch('/api/v1/auth/login')
 *               Vite proxy        →  http://localhost:8080/api/v1/auth/login
 */

export const API_ENDPOINTS = Object.freeze({
  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_ME: '/auth/me',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_GUEST_SESSION: '/auth/guest-session',

  // ── Productos ─────────────────────────────────────────────────────────────
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id) => `/products/${id}`,

  // ── Admin – Productos ─────────────────────────────────────────────────────
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_BY_ID: (id) => `/admin/products/${id}`,

  // ── Admin – Usuarios ──────────────────────────────────────────────────────
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_BY_ID: (id) => `/admin/users/${id}`,

  // ── Categorías ────────────────────────────────────────────────────────────
  CATEGORIES: '/categories',
  CATEGORIES_TREE: '/categories/tree',
  CATEGORY_BY_ID: (id) => `/categories/${id}`,
  CATEGORY_SUBCATEGORIES: (id) => `/categories/${id}/subcategories`,

  // ── Carrito ───────────────────────────────────────────────────────────────
  CART_ME: '/cart/me',
  CART_ITEMS: '/cart/items',
  CART_ITEM_BY_ID: (id) => `/cart/items/${id}`,
  CART_MERGE: '/cart/merge',

  // ── Órdenes ───────────────────────────────────────────────────────────────
  ORDERS_ME: '/orders/me',
  ORDERS_CHECKOUT: '/orders/checkout',
  ORDER_BY_ID: (id) => `/orders/${id}`,

  // ── Perfil de usuario ─────────────────────────────────────────────────────
  USERS_ME: '/users/me',
  USERS_ME_PASSWORD: '/users/me/password',
  USERS_ME_ADDRESSES: '/users/me/addresses',
  USERS_ME_ADDRESS_BY_ID: (id) => `/users/me/addresses/${id}`,
  USERS_ME_ADDRESS_DEFAULT: (id) => `/users/me/addresses/${id}/default`,
});
