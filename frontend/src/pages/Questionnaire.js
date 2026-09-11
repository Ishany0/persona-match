import React, { useEffect, useState } from "react";
import { getCategories, submitQuestionnaire } from "../api";

export default function Questionnaire({ user }) {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      setCategory(cats[0]);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    if (tagList.length === 0) {
      setStatus("add at least one tag first");
      return;
    }

    await submitQuestionnaire(user.id, category, tagList);
    setStatus(`saved your "${category}" persona. Go check your matches!`);
    setTags("");
  }

  if (!user) return null;

  return (
    <div className="page">
      <h2>Category questionnaire</h2>
      <p className="subtitle">
        Pick a category and describe what matters to you for it, in a few tags.
        We use these tags to find people who overlap with you the most.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <label>Tags (comma separated)</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. dsa, late-night-study, quiet, ml"
        />

        <button type="submit" className="btn primary">Save answers</button>
        {status && <p className="status-text">{status}</p>}
      </form>
    </div>
  );
}
