import { useEffect, useMemo, useState } from "react";

import "./App.css";

import Footer from "./components/Footer";
import Header from "./components/Header";

import Cart from "./page/Cart";
import CategoryProducts from "./page/CategoryProducts";
import Checkout from "./page/Checkout";
import Home from "./page/Home";
import OrderConfirmation from "./page/Orderconfirmation";
import ProductList from "./page/ProductList";

import { loadCartItems, CART_STORAGE_KEY } from "./utils/CartStorage";
import { saveOrder } from "./utils/Ordersstorage";

function App() {
  const [activePage, setActivePage] = useState("home");
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cartItems, setCartItems] = useState(loadCartItems);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Persiste el carrito en localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      void error;
    }
  }, [cartItems]);

  const cartItemCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  // --- Navegación ---

  const handleNavigate = (page) => {
    if (page !== "category") setSelectedCategory(null);
    setActivePage(page);
  };

  const handleOpenCategory = (category) => {
    setSelectedCategory(category);
    setActivePage("category");
  };

  const handleBackFromCategory = () => {
    setSelectedCategory(null);
    setActivePage("home");
  };

  // --- Auth ---

  const handleSignIn = () => setUser({ name: "Usuario" });
  const handleSignOut = () => setUser(null);

  // --- Carrito ---

  const handleAddToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateCartItemQuantity = (id, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const clamped = Math.min(Math.max(1, quantity), item.stock);
        return { ...item, quantity: clamped };
      })
    );
  };

  const handleRemoveCartItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => setCartItems([]);

  // --- Checkout ---

  const handleStartCheckout = () => setActivePage("checkout");

  const handleCompleteCheckout = (orderData) => {
    const saved = saveOrder({
      ...orderData,
      date: new Date().toISOString(),
      id: crypto.randomUUID(),
    });
    setCurrentOrder(saved);
    setCartItems([]);
    setActivePage("order-confirmation");
  };

  const handleBackHomeAfterOrder = () => {
    setCurrentOrder(null);
    setActivePage("home");
  };

  // --- Render ---

  const page = useMemo(() => {
    if (activePage === "products") return <ProductList />;

    if (activePage === "cart") {
      return (
        <Cart
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartItemQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onCheckout={handleStartCheckout}
        />
      );
    }

    if (activePage === "checkout") {
      return (
        <Checkout
          cartItems={cartItems}
          onConfirm={handleCompleteCheckout}
          onBack={() => setActivePage("cart")}
        />
      );
    }

    if (activePage === "order-confirmation") {
      return (
        <OrderConfirmation
          order={currentOrder}
          onBackHome={handleBackHomeAfterOrder}
        />
      );
    }

    if (activePage === "category") {
      return (
        <CategoryProducts
          category={selectedCategory}
          onBack={handleBackFromCategory}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
        />
      );
    }

    return <Home onOpenCategory={handleOpenCategory} />;
  }, [activePage, selectedCategory, cartItems, currentOrder]);

  return (
    <div className="app">
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        cartItemCount={cartItemCount}
      />

      <main className="main">{page}</main>

      <Footer />
    </div>
  );
}

export default App;