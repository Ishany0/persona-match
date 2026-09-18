import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const user = await loginUser(email, password);
      localStorage.setItem("pm_user", JSON.stringify(user)); setUser(user); navigate("/matches");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  return (
    <div className="auth-layout">
      <div className="auth-story"><span className="kicker">WELCOME BACK</span><h1>Your people<br /><em>are waiting.</em></h1><p>Pick up where you left off and see who fits your latest preferences.</p><div className="quote-card">“The best part of campus is finding people who make it feel like yours.”<span>— PersonaMatch</span></div></div>
      <div className="auth-card"><span className="badge">Welcome back</span><h2>Log in</h2><p>See your profile, questionnaire and latest matches.</p><form onSubmit={handleSubmit}><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@thapar.edu" /><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Your password" />{error && <p className="error-text">{error}</p>}<button className="btn btn-primary full" type="submit" disabled={loading}>{loading ? "Logging in..." : "Log in →"}</button></form><p className="auth-foot">New here? <Link to="/register">Create an account</Link></p></div>
    </div>
  );
}
