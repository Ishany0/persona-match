import React from "react";
import { Link } from "react-router-dom";

export default function Home({ user }) {
  return (
    <div className="page home">
      <h1>PersonaMatch</h1>
      <p className="subtitle">
        Find the right study partner, project teammate, roommate or mentor on campus -
        matched on what actually matters, not just who's online.
      </p>

      {!user && (
        <div className="cta-row">
          <Link to="/register" className="btn primary">Get started</Link>
          <Link to="/login" className="btn">I already have an account</Link>
        </div>
      )}

      {user && (
        <div className="cta-row">
          <Link to="/questionnaire" className="btn primary">Fill a category questionnaire</Link>
          <Link to="/matches" className="btn">See my matches</Link>
        </div>
      )}

      <div className="how-it-works">
        <h3>How it works</h3>
        <ol>
          <li>Register with your university email and build a quick profile.</li>
          <li>Pick a category - Study Partner, Project Teammate, Roommate or Mentor.</li>
          <li>Answer a short set of tags for that category.</li>
          <li>Get a ranked list of compatible people, and message them in-app.</li>
        </ol>
      </div>
    </div>
  );
}
