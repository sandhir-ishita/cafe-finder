import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  // FIX: Only show "Manage cafes" link if the user has the admin role.
  // Previously it was shown to ALL logged-in users, exposing the admin UI link.
  const isAdmin = isAuthenticated && user?.role === "admin";

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        Smart Cafe Finder
      </Link>

      <div className="navbar__links">
        <Link to="/">Home</Link>
        <Link to="/favorites">Favorites</Link>

        {isAdmin && <Link to="/manage-cafes">Manage cafes</Link>}

        {isAuthenticated ? (
          <>
            <span className="navbar__user">Hi, {user.name}</span>
            <button
              type="button"
              className="button button--ghost button--compact"
              onClick={logout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
