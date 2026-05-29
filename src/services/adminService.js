import authService from './authService';
import orderService from './orderService';
import productService from './productService';

function getDashboardSnapshot() {
  return {
    products: productService.getProducts(),
    orders: orderService.getOrders(),
    users: authService.getAdminUsers(),
  };
}

async function getDashboardSnapshotAsync() {
  const settle = (promise, fallback) => promise.catch(() => fallback);

  const [products, orders, users] = await Promise.all([
    settle(productService.getProductsAsync(), []),
    settle(orderService.getOrdersAsync(), []),
    settle(authService.getAdminUsersAsync(), []),
  ]);

  return {
    products,
    orders,
    users,
  };
}

const adminService = {
  getDashboardSnapshot,
  getDashboardSnapshotAsync,
};

export { adminService };
export default adminService;
