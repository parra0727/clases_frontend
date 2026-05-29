import { appConfig } from '../config';
import { loadSessionToken, saveSessionToken } from '../utils/authStorage';
import { loadCart, saveCart, saveCartItems } from '../utils/cartStorage';

import { requestJson } from './http';

let pendingGuestSessionPromise = null;

const REMOTE_CART_ID_PATTERN = /^\d+$/;

const normalizeProductStock = (product) => {
  const parsedStock = Number(product?.productStock ?? product?.stockQty ?? product?.stock);
  return Number.isFinite(parsedStock) && parsedStock >= 0 ? parsedStock : 0;
};

const normalizeCartResponse = (payload) =>
  saveCart({
    ...payload,
    updatedAt: payload?.updatedAt ?? new Date().toISOString(),
  });

const getGuestCartIdForAuth = (cart = loadCart()) => {
  const normalizedCartId = String(cart?.id ?? '').trim();
  const normalizedUserId = String(cart?.userId ?? '').trim();

  if (
    !normalizedCartId ||
    normalizedUserId ||
    cart?.isGuest === false ||
    !REMOTE_CART_ID_PATTERN.test(normalizedCartId)
  ) {
    return '';
  }

  return normalizedCartId;
};

const ensureRemoteCartSession = async () => {
  const currentToken = loadSessionToken();

  if (currentToken) {
    return currentToken;
  }

  if (pendingGuestSessionPromise) {
    return pendingGuestSessionPromise;
  }

  pendingGuestSessionPromise = requestJson('/auth/guest-session', {
    method: 'POST',
  })
    .then((response) => {
      const nextToken = String(response?.sessionToken ?? response?.token ?? '').trim();

      if (!nextToken) {
        throw new Error('No fue posible inicializar la sesión invitada del carrito.');
      }

      saveSessionToken(nextToken);

      if (response?.cart) {
        normalizeCartResponse(response.cart);
      }

      return nextToken;
    })
    .finally(() => {
      pendingGuestSessionPromise = null;
    });

  return pendingGuestSessionPromise;
};

const buildLocalCart = (items, currentCart = loadCart()) =>
  saveCart({
    ...currentCart,
    updatedAt: new Date().toISOString(),
    items,
  });

function getCartItems() {
  return loadCart().items;
}

function getCart() {
  return loadCart();
}

function persistCartItems(items) {
  return saveCartItems(items).items;
}

function addToCart(product, currentItems = getCartItems()) {
  if (!product || !Number.isFinite(Number(product.id))) {
    return currentItems;
  }

  const normalizedId = Number(product.id);
  const stock = normalizeProductStock(product);
  const existingItem = currentItems.find((item) => item.id === normalizedId);
  const nextItemBase = {
    id: normalizedId,
    productId: normalizedId,
    sku: String(product?.sku ?? ''),
    name: product.name,
    category: product.categoryName ?? product.category,
    categoryName: product.categoryName ?? product.category,
    price: Number(product.price) || 0,
    unitPrice: Number(product.price) || 0,
    stock,
    stockQty: stock,
    productStock: stock,
    productAvailable: Boolean(product?.isAvailable ?? stock > 0),
    image: product.image,
    addedAt: new Date().toISOString(),
  };

  if (!existingItem) {
    return persistCartItems([
      ...currentItems,
      {
        ...nextItemBase,
        quantity: 1,
        lineTotal: Number(product.price) || 0,
      },
    ]);
  }

  return persistCartItems(
    currentItems.map((item) => {
      if (item.id !== normalizedId) {
        return item;
      }

      return {
        ...item,
        ...nextItemBase,
        stock,
        stockQty: stock,
        productStock: stock,
        quantity: Math.min(item.quantity + 1, Math.max(stock, 1)),
        lineTotal:
          (Number(item.unitPrice ?? item.price) || 0) *
          Math.min(item.quantity + 1, Math.max(stock, 1)),
      };
    })
  );
}

function updateCartItemQuantity(productId, nextQuantity, currentItems = getCartItems()) {
  return persistCartItems(
    currentItems.flatMap((item) => {
      if (item.id !== productId) {
        return [item];
      }

      const stock = Number.isFinite(Number(item.stock)) && Number(item.stock) > 0 ? item.stock : 1;
      const normalizedQuantity = Math.max(
        1,
        Math.min(stock, Math.floor(Number(nextQuantity) || 1))
      );

      return normalizedQuantity > 0
        ? [
            {
              ...item,
              quantity: normalizedQuantity,
              lineTotal: (Number(item.unitPrice ?? item.price) || 0) * normalizedQuantity,
            },
          ]
        : [];
    })
  );
}

function removeCartItem(productId, currentItems = getCartItems()) {
  return persistCartItems(currentItems.filter((item) => item.id !== productId));
}

function clearCart() {
  return persistCartItems([]);
}

function getCartItemCount(currentItems = getCartItems()) {
  return currentItems.reduce((total, item) => total + item.quantity, 0);
}

async function getCartAsync() {
  if (!appConfig.useRemoteApi) {
    return getCart();
  }

  const token = await ensureRemoteCartSession();
  const response = await requestJson('/cart/me', {
    method: 'GET',
    token,
  });

  return normalizeCartResponse(response);
}

async function addToCartAsync(product, currentItems = getCartItems()) {
  if (!appConfig.useRemoteApi) {
    return buildLocalCart(addToCart(product, currentItems));
  }

  const token = await ensureRemoteCartSession();
  const response = await requestJson('/cart/items', {
    method: 'POST',
    token,
    body: {
      productId: Number(product?.productId ?? product?.id),
      quantity: 1,
    },
  });

  return normalizeCartResponse(response);
}

async function updateCartItemQuantityAsync(productId, nextQuantity, currentItems = getCartItems()) {
  if (!appConfig.useRemoteApi) {
    return buildLocalCart(updateCartItemQuantity(productId, nextQuantity, currentItems));
  }

  const token = await ensureRemoteCartSession();
  const response = await requestJson(`/cart/items/${productId}`, {
    method: 'PATCH',
    token,
    body: {
      quantity: Math.max(1, Math.floor(Number(nextQuantity) || 1)),
    },
  });

  return normalizeCartResponse(response);
}

async function removeCartItemAsync(productId, currentItems = getCartItems()) {
  if (!appConfig.useRemoteApi) {
    return buildLocalCart(removeCartItem(productId, currentItems));
  }

  const token = await ensureRemoteCartSession();
  const response = await requestJson(`/cart/items/${productId}`, {
    method: 'DELETE',
    token,
  });

  return normalizeCartResponse(response);
}

async function clearCartAsync() {
  if (!appConfig.useRemoteApi) {
    return clearCart();
  }

  const token = await ensureRemoteCartSession();

  try {
    await requestJson('/cart/items', {
      method: 'DELETE',
      token,
    });
  } catch (error) {
    if (error?.status < 500) throw error;
    // Backend failed to clear cart; proceed with local clear anyway.
  }

  return saveCart({ ...loadCart(), items: [], updatedAt: new Date().toISOString() });
}

async function mergeCartAsync(guestCartId) {
  const normalizedGuestCartId = String(guestCartId ?? '').trim();

  if (!normalizedGuestCartId || !appConfig.useRemoteApi) {
    return getCart();
  }

  const token = loadSessionToken();
  const response = await requestJson('/cart/merge', {
    method: 'POST',
    token,
    body: {
      guestCartId: normalizedGuestCartId,
    },
  });

  // Ensure the merged cart is persisted as a user cart (not guest).
  return normalizeCartResponse({ ...response, isGuest: false });
}

const cartService = {
  addToCart,
  addToCartAsync,
  clearCart,
  clearCartAsync,
  getCart,
  getCartAsync,
  getCartItemCount,
  getCartItems,
  getGuestCartIdForAuth,
  mergeCartAsync,
  persistCartItems,
  removeCartItem,
  removeCartItemAsync,
  updateCartItemQuantity,
  updateCartItemQuantityAsync,
};

export { cartService };
export default cartService;
