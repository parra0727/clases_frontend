import styles from "../styles/Header.module.css";

import Navbar from "./Navbar";

function Header({ activePage, onNavigate, user, onSignIn, onSignOut, cartItemCount }) {
  return (
    <header className={styles.header}>
      <Navbar
        activePage={activePage}
        onNavigate={onNavigate}
        user={user}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        cartItemCount={cartItemCount}
      />
    </header>
  );
}

export default Header;