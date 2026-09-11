import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, getMatches } from "../api";

export default function Matches({ user }) {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      setCategory(cats[0]);
    });
  }, []);

  useEffect(() => {
    if (!category || !user) return;
    setError("");
    getMatches(user.id, category)
      .then(setMatches)
      .catch((err) => {
        setMatches([]);
        setError(err.message);
      });
  }, [category, user]);

  if (!user) return null;

  return (
    <div className="page">
      <h2>Your matches</h2>

      <label>Category</label>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {error && <p className="error-text">{error}</p>}

      {!error && matches.length === 0 && (
        <p className="subtitle">No matches yet for this category - try widening your tags a bit.</p>
      )}

      <div className="match-list">
        {matches.map((m) => (
          <div key={m.user_id} className="card match-card">
            <div className="match-header">
              <strong>{m.name}</strong>
              <span className="score-pill">{Math.round(m.score * 100)}% match</span>
            </div>
            {m.bio && <p className="bio">{m.bio}</p>}
            <p className="tags">{m.tags.join(", ")}</p>
            <Link to={`/chat/${m.user_id}/${encodeURIComponent(m.name)}`} className="btn">
              Message
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
