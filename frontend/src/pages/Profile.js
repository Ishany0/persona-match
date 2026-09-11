import React, { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../api";

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
    const interestList = interests.split(",").map((t) => t.trim()).filter(Boolean);
    const tagList = personalityTags.split(",").map((t) => t.trim()).filter(Boolean);

    const updated = await updateProfile(user.id, bio, interestList, tagList);
    const merged = { ...user, ...updated };
    localStorage.setItem("pm_user", JSON.stringify(merged));
    setUser(merged);
    setStatus("saved!");
    setTimeout(() => setStatus(""), 1500);
  }

  if (!user) return null;

  return (
    <div className="page">
      <h2>Your profile</h2>
      <form onSubmit={handleSave} className="card">
        <label>Bio</label>
        <textarea
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A couple lines about yourself..."
        />

        <label>Interests (comma separated)</label>
        <input
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="e.g. competitive coding, badminton, sci-fi movies"
        />

        <label>Personality tags (comma separated)</label>
        <input
          value={personalityTags}
          onChange={(e) => setPersonalityTags(e.target.value)}
          placeholder="e.g. night-owl, introvert, planner"
        />

        <button type="submit" className="btn primary">Save profile</button>
        {status && <span className="status-text">{status}</span>}
      </form>
    </div>
  );
}
