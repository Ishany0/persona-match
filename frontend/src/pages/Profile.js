import React, { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../api";

const suggestedTags = ["Study buddy", "Night owl", "Creative", "Planner", "Sports", "Music", "Tech", "Travel"];

export default function Profile({ user, setUser }) {
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [personalityTags, setPersonalityTags] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((p) => {
      setBio(p.bio || "");
      setInterests((p.interests || []).join(", "));
      setPersonalityTags((p.personality_tags || []).join(", "));
    });
  }, [user]);

  async function handleSave(e) {
    e.preventDefault();
    setStatus("saving...");
    try {
      const interestList = interests.split(",").map((t) => t.trim()).filter(Boolean);
      const tagList = personalityTags.split(",").map((t) => t.trim()).filter(Boolean);
      const updated = await updateProfile(user.id, bio, interestList, tagList);
      const merged = { ...user, ...updated };
      localStorage.setItem("pm_user", JSON.stringify(merged));
      setUser(merged);
      setStatus("saved!");
      setTimeout(() => setStatus(""), 1500);
    } catch (err) {
      setStatus(err.message);
    }
  }

  if (!user) return null;

  return (
    <div className="page profile-page">
      <div className="profile-layout">
        <aside className="profile-intro">
          <span className="kicker">Your PersonaMatch profile</span>
          <h1>Tell your story.<br /><em>Find your people.</em></h1>
          <p>Give people a quick sense of who you are. These details also help PersonaMatch find better overlaps.</p>
          <div className="profile-stats"><div><strong>8+</strong><span>interest signals</span></div><div><strong>40%</strong><span>typical overlap</span></div><div><strong>100</strong><span>ways to connect</span></div></div>
        </aside>

        <form onSubmit={handleSave} className="profile-form">
          <div className="form-head"><div><span className="badge">Profile</span><h2>Hey {user.name}, ready to meet someone new?</h2><p>Keep it honest, specific and a little bit you.</p></div><button className="save-top" type="submit">Save</button></div>

          <label>Display name</label>
          <input value={user.name || ""} readOnly />

          <label>Bio</label>
          <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A couple lines about yourself..." />

          <label>Personality tags</label>
          <p className="field-help">Pick a few words that describe how you work and connect.</p>
          <div className="suggested-tags">{suggestedTags.map((tag) => <button key={tag} type="button" onClick={() => setPersonalityTags((v) => v ? `${v}, ${tag}` : tag)}>{tag}</button>)}</div>
          <input value={personalityTags} onChange={(e) => setPersonalityTags(e.target.value)} placeholder="e.g. night-owl, introvert, planner" />

          <label>Interests</label>
          <p className="field-help">Separate interests with commas.</p>
          <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="e.g. ML, football, music, cafes" />

          <button className="btn btn-primary full" type="submit">Update profile <span>→</span></button>
          {status && <p className="status-text">{status}</p>}
        </form>
      </div>
    </div>
  );
}
