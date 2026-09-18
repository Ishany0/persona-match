import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, getMatches } from "../api";

function initials(name = "?") {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function Matches({ user }) {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      setCategory(cats[0] || "");
    }).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!category || !user) return;
    setError("");
    getMatches(user.id, category).then(setMatches).catch((err) => {
      setMatches([]);
      setError(err.message);
    });
  }, [category, user]);

  if (!user) return null;

  return (
    <div className="page inner-page">
      <div className="page-heading-row">
        <div><span className="kicker">Your people</span><h1>Your matches</h1><p>People ranked by how well their preferences line up with yours.</p></div>
        <div className="filter-box"><label htmlFor="match-category">Match type</label><select id="match-category" value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!error && matches.length === 0 && (
        <div className="empty-card"><div className="empty-icon">✦</div><h3>No matches yet</h3><p>Try adding a few more tags to your questionnaire and come back.</p><Link className="btn btn-primary" to="/questionnaire">Update questionnaire →</Link></div>
      )}

      <div className="match-grid">
        {matches.map((m) => (
          <article key={m.user_id} className="match-card">
            <div className="match-top"><div className="match-avatar">{initials(m.name)}</div><span className="score">{Math.round(m.score * 100)}% match</span></div>
            <h2>{m.name}</h2>
            <p className="match-meta">Compatible {category?.toLowerCase()}</p>
            {m.bio && <p className="match-bio">{m.bio}</p>}
            <div className="chips">{m.tags.map((t) => <span key={t}>{t}</span>)}</div>
            <Link className="match-button" to={`/chat/${m.user_id}/${encodeURIComponent(m.name)}`}>Message <span>→</span></Link>
          </article>
        ))}
      </div>
    </div>
  );
}
