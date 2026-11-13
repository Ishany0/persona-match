import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try { const result = await forgotPassword(email); setMessage(result.message); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  return <div className="auth-layout"><div className="auth-story"><span className="kicker">ACCOUNT RECOVERY</span><h1>Let's get you<br/><em>back to PersonaMatch.</em></h1><p>We'll send a secure, one-time password reset link to your verified university inbox.</p></div><div className="auth-card"><span className="badge">Forgot password</span><h2>Reset your password</h2><p>Enter the Thapar email address linked to your account.</p><form onSubmit={submit}><label>University email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@thapar.edu"/>{error && <p className="error-text">{error}</p>}{message && <p className="status-text">{message}</p>}<button className="btn btn-primary full" disabled={loading}>{loading ? "Sending..." : "Send reset link →"}</button></form><p className="auth-foot"><Link to="/login">← Back to login</Link></p></div></div>;
}
