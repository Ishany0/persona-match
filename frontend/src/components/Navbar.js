import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("pm_user");
    setUser(null);
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">PersonaMatch</Link>

      {user ? (
        <div className="nav-links">
          <Link to="/profile">Profile</Link>
          <Link to="/questionnaire">Questionnaire</Link>
          <Link to="/matches">Matches</Link>
          <span className="nav-user">hi, {user.name}</span>
          <button onClick={handleLogout} className="link-btn">Logout</button>
        </div>
      ) : (
        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      )}
    </nav>
  );
}
