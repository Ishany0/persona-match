import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    localStorage.removeItem("pm_user");
    setUser(null);
    navigate("/login");
  }

  const active = (path) => location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark"><span /><span /></span>
        <span>Persona<span>Match</span></span>
      </Link>

      {user ? (
        <div className="nav-right">
          <nav className="nav-links">
            <Link className={active("/profile")} to="/profile">Profile</Link>
            <Link className={active("/questionnaire")} to="/questionnaire">Questionnaire</Link>
            <Link className={active("/matches")} to="/matches">Matches</Link>
          </nav>
          <div className="nav-divider" />
          <div className="nav-user">
            <span className="nav-avatar">{(user.name || "?").charAt(0).toUpperCase()}</span>
            <span className="nav-name">{user.name}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      ) : (
        <div className="nav-actions">
          <Link className="nav-login" to="/login">Log in</Link>
          <Link className="btn btn-primary btn-small" to="/register">Get started <span>→</span></Link>
        </div>
      )}
    </header>
  );
}
