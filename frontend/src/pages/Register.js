import React, { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser, resendVerification } from "../api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setNotice(""); setLoading(true);
    try {
      const user = await registerUser(name, email, password);
      setNotice(user.message || "Registration created. Check your Thapar inbox and verify your email before logging in.");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function handleResend() {
    setResendMessage("");
    try { const result = await resendVerification(email); setResendMessage(result.message); }
    catch (err) { setResendMessage(err.message); }
  }

  return (
    <div className="auth-layout">
      <div className="auth-story"><span className="kicker">PERSONAMATCH</span><h1>Good connections<br /><em>feel easy.</em></h1><p>Build your campus circle around compatibility, not endless scrolling.</p><div className="auth-stat"><strong>01</strong><span>Tell us about yourself</span></div><div className="auth-stat"><strong>02</strong><span>Answer a few questions</span></div><div className="auth-stat"><strong>03</strong><span>Meet your overlap</span></div></div>
      <div className="auth-card"><span className="badge">New here?</span><h2>Create your account</h2><p>Start building a profile that actually says something about you.</p><form onSubmit={handleSubmit}><label>Full name</label><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" /><label>University email</label><input type="email" placeholder="you@thapar.edu" value={email} onChange={(e) => setEmail(e.target.value)} required /><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required placeholder="At least 8 characters, letters + numbers" /><small className="field-help">Use your official @thapar.edu email. You must verify it before logging in.</small>{error && <p className="error-text">{error}</p>}{notice && <p className="status-text">{notice}</p>}{notice && <button type="button" className="save-top" onClick={handleResend}>Resend verification email</button>}{resendMessage && <p className="status-text">{resendMessage}</p>}<button className="btn btn-primary full" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account →"}</button></form><p className="auth-foot">Already have an account? <Link to="/login">Log in</Link></p></div>
    </div>
  );
}
