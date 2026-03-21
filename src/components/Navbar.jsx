import styles from "../styles/Navbar.module.css";

import logo from "../assets/react.svg";

function Navbar({ activePage, onNavigate, user, onSignIn, onSignOut, cartItemCount }) {
  const userLabel = user?.name ?? "Invitado";
  const isLoggedIn = Boolean(user);

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <img className={styles.logo} src={logo} alt="Logo" />
        <span className={styles.brandName}>Sistema Ventas</span>
      </div>

      <div className={styles.links}>
        <button
          type="button"
          className={`${styles.link} ${activePage === "home" ? styles.active : ""}`}
          onClick={() => onNavigate("home")}
        >
          Inicio
        </button>
        <button
          type="button"
          className={`${styles.link} ${activePage === "products" ? styles.active : ""}`}
          onClick={() => onNavigate("products")}
        >
          Productos
        </button>
        <button
          type="button"
          className={`${styles.link} ${activePage === "cart" ? styles.active : ""}`}
          onClick={() => onNavigate("cart")}
        >
          Carrito
          {cartItemCount > 0 ? (
            <span className={styles.badge}>{cartItemCount}</span>
          ) : null}
        </button>
      </div>

      <div className={styles.auth}>
        <span className={styles.userName}>{userLabel}</span>

        {isLoggedIn ? (
          <button type="button" className={styles.authBtn} onClick={onSignOut}>
            Sign out
          </button>
        ) : (
          <button type="button" className={styles.authBtn} onClick={onSignIn}>
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;