import { appConfig } from '../config';
import { loadSessionToken } from '../utils/authStorage';
import { loadCart } from '../utils/cartStorage';
import { loadOrders, loadOrdersByUserId, saveOrder, saveOrders } from '../utils/ordersStorage';

import { requestJson } from './http';

const createLocalOrderId = () => String(Date.now());
const createLocalOrderNumber = () =>
  `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
    Math.random() * 1000000
  )
    .toString()
    .padStart(6, '0')}`;
const toAsyncResult = (callback) => Promise.resolve().then(callback);

const normalizeOrderPayload = (order) => ({
  ...order,
  id: String(order?.id ?? createLocalOrderId()),
  orderNumber: String(order?.orderNumber ?? createLocalOrderNumber()),
  status: String(order?.status ?? 'PENDING'),
  createdAt: order?.createdAt ?? new Date().toISOString(),
  customer: order?.customer ?? null,
  totals: order?.totals ?? { subtotal: 0, tax: 0, shipping: 0, total: 0 },
  items: Array.isArray(order?.items) ? order.items : [],
});

function getOrders() {
  return loadOrders();
}

function getOrdersByUserId(userId) {
  return loadOrdersByUserId(userId);
}

function getOrderByIdForUser(userId, orderId) {
  return getOrdersByUserId(userId).find((order) => order.id === orderId) ?? null;
}

function createOrder(order) {
  return saveOrder(normalizeOrderPayload(order));
}

function getOrdersAsync() {
  if (appConfig.useRemoteApi) {
    return requestJson('/orders/me', {
      method: 'GET',
      token: loadSessionToken(),
    })
      .then((response) => saveOrders(Array.isArray(response) ? response : []))
      .catch((error) => {
        // Backend returns 500 for users with no orders instead of [].
        // Treat any server-side error as an empty list so the UI doesn't
        // show a crash message on a freshly registered account.
        if (error?.status >= 500) {
          return saveOrders([]);
        }
        throw error;
      });
  }

  return toAsyncResult(() => getOrders());
}

function getOrdersByUserIdAsync(userId) {
  if (appConfig.useRemoteApi) {
    return getOrdersAsync();
  }

  return toAsyncResult(() => getOrdersByUserId(userId));
}

function getOrderByIdForUserAsync(userId, orderId) {
  if (appConfig.useRemoteApi) {
    return requestJson(`/orders/${orderId}`, {
      method: 'GET',
      token: loadSessionToken(),
    }).then((response) => saveOrder(normalizeOrderPayload(response)));
  }

  return toAsyncResult(() => getOrderByIdForUser(userId, orderId));
}

function createOrderAsync(order) {
  if (!appConfig.useRemoteApi) {
    return toAsyncResult(() => createOrder(order));
  }

  const cart = loadCart();
  const cartId = Number(cart.id);
  const shippingAddressId = Number(
    order?.shippingAddress?.id ?? order?.shippingAddressId ?? ''
  );
  const billingAddressId = Number(
    order?.billingAddress?.id ?? order?.billingAddressId ?? ''
  );

  if (!Number.isFinite(cartId) || cartId <= 0) {
    return Promise.reject(
      new Error(
        'El carrito no está sincronizado con el servidor. Recarga la página e intenta de nuevo.'
      )
    );
  }

  if (!Number.isFinite(shippingAddressId) || shippingAddressId <= 0) {
    return Promise.reject(new Error('Selecciona una dirección de envío válida.'));
  }

  if (!Number.isFinite(billingAddressId) || billingAddressId <= 0) {
    return Promise.reject(new Error('Selecciona una dirección de facturación válida.'));
  }

  return requestJson('/orders/checkout', {
    method: 'POST',
    token: loadSessionToken(),
    body: {
      cartId,
      shippingAddressId,
      billingAddressId,
    },
  }).then((response) =>
    saveOrder(
      normalizeOrderPayload({
        customer: order.customer,
        totals: order.totals,
        ...response,
        items:
          Array.isArray(response?.items) && response.items.length > 0
            ? response.items
            : (order.items ?? []),
      })
    )
  );
}

const orderService = {
  createOrder,
  createOrderAsync,
  getOrderByIdForUser,
  getOrderByIdForUserAsync,
  getOrders,
  getOrdersAsync,
  getOrdersByUserId,
  getOrdersByUserIdAsync,
};

export { orderService };
export default orderService;
