import React, { useEffect, useState } from "react";
import { getCategories, submitQuestionnaire } from "../api";

const categoryCopy = {
  "Study Partner": "Find someone with a study rhythm that works with yours.",
  "Project Teammate": "Find complementary skills for projects, hackathons and builds.",
  "Roommate": "Match on routines, habits and the little things that matter.",
  "Mentor": "Find someone whose experience can help you move forward.",
};

export default function Questionnaire({ user }) {
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      setCategory(cats[0] || "");
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (!tagList.length) {
      setStatus("Add at least one tag first.");
      return;
    }
    try {
      await submitQuestionnaire(user.id, category, tagList);
      setStatus(`Saved your "${category}" persona. Go check your matches!`);
      setTags("");
    } catch (err) {
      setStatus(err.message);
    }
  }

  if (!user) return null;

  return (
    <div className="page inner-page questionnaire-page">
      <div className="questionnaire-head"><span className="kicker">Compatibility setup</span><h1>What kind of connection<br /><em>are you looking for?</em></h1><p>Choose a category, then give us a few signals. We'll use them to find the overlap.</p></div>

      <form onSubmit={handleSubmit} className="questionnaire-card">
        <div className="question-step"><span>01</span><div><label>Connection type</label><h2>{category || "Choose a category"}</h2><p>{categoryCopy[category] || "Choose what you need from your campus network."}</p></div></div>
        <div className="category-options">
          {categories.map((c) => <button type="button" key={c} className={category === c ? "selected" : ""} onClick={() => setCategory(c)}><span>{c === "Study Partner" ? "✦" : c === "Project Teammate" ? "⌘" : c === "Roommate" ? "⌂" : "↗"}</span>{c}<b>{category === c ? "✓" : "○"}</b></button>)}
        </div>

        <div className="question-step"><span>02</span><div><label>What matters to you?</label><h2>Your tags</h2><p>Add keywords separated by commas. Think habits, skills, pace and interests.</p></div></div>
        <input className="big-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. dsa, late-night-study, quiet, ml" />

        <div className="questionnaire-footer"><small>Tip: specific tags usually create more useful overlaps.</small><button className="btn btn-primary" type="submit">Save & find matches <span>→</span></button></div>
        {status && <p className="status-text">{status}</p>}
      </form>
    </div>
  );
}
