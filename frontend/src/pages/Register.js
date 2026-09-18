import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api";

export default function Register({ setUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const user = await registerUser(name, email, password);
      localStorage.setItem("pm_user", JSON.stringify(user)); setUser(user); navigate("/profile");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="auth-layout">
      <div className="auth-story"><span className="kicker">PERSONAMATCH</span><h1>Good connections<br /><em>feel easy.</em></h1><p>Build your campus circle around compatibility, not endless scrolling.</p><div className="auth-stat"><strong>01</strong><span>Tell us about yourself</span></div><div className="auth-stat"><strong>02</strong><span>Answer a few questions</span></div><div className="auth-stat"><strong>03</strong><span>Meet your overlap</span></div></div>
      <div className="auth-card"><span className="badge">New here?</span><h2>Create your account</h2><p>Start building a profile that actually says something about you.</p><form onSubmit={handleSubmit}><label>Full name</label><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" /><label>University email</label><input type="email" placeholder="you@thapar.edu" value={email} onChange={(e) => setEmail(e.target.value)} required /><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required placeholder="At least 6 characters" />{error && <p className="error-text">{error}</p>}<button className="btn btn-primary full" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account →"}</button></form><p className="auth-foot">Already have an account? <Link to="/login">Log in</Link></p></div>
    </div>
  );
}
