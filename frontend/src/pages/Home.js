import React from "react";
import { Link } from "react-router-dom";

const connections = [
  { icon: "✦", title: "Study partners", text: "Find people with similar study rhythms, subjects and goals.", tone: "lavender" },
  { icon: "⌘", title: "Project teammates", text: "Meet people whose skills and interests complement yours.", tone: "peach" },
  { icon: "⌂", title: "Roommates", text: "Match on routines, habits and the little things that matter.", tone: "mint" },
  { icon: "↗", title: "Mentors", text: "Connect with people who can help you figure out what comes next.", tone: "pink" },
];

export default function Home({ user }) {
  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">PERSONAMATCH · CAMPUS CONNECTIONS</div>
          <h1>Find your people.<br /><span>Not just profiles.</span></h1>
          <p>
            Tell us how you study, build, live and grow. PersonaMatch finds
            campus connections based on what actually fits.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to={user ? "/questionnaire" : "/register"}>
              {user ? "Find my matches" : "Find my people"} <span>→</span>
            </Link>
            <Link className="text-button" to={user ? "/matches" : "/login"}>
              {user ? "View matches" : "I already have an account"} <span>↗</span>
            </Link>
          </div>
          <div className="hero-points">
            <span>✓ Preference-first</span>
            <span>✓ Compatibility based</span>
            <span>✓ Built for campus life</span>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="glow glow-one" />
          <div className="glow glow-two" />
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />

          <div className="floating-pill pill-one"><strong>94%</strong><span>compatible</span></div>
          <div className="floating-pill pill-two"><span className="mini-avatar">R</span><div><strong>3 shared interests</strong><small>great project fit</small></div></div>

          <div className="preview-card">
            <div className="preview-top"><span>MATCH FOR YOU</span><b>●</b></div>
            <div className="preview-profile">
              <div className="preview-avatar">A</div>
              <div><h3>Aanya Sharma</h3><p>Computer Science · 2nd year</p></div>
            </div>
            <p className="preview-bio">“Usually in the library after 6. I like focused study sessions, hackathons and building things that actually ship.”</p>
            <div className="chips"><span>Python</span><span>DSA</span><span>Hackathons</span></div>
            <div className="preview-footer"><span>Study partner</span><b>↗</b></div>
          </div>
          <div className="match-badge">match</div>
        </div>
      </section>

      <section className="stat-strip">
        <div><strong>01</strong><span>Tell us your world</span></div>
        <p>Good connections aren't random. <b>They're compatible.</b></p>
        <div><strong>03</strong><span>Meet your overlap</span></div>
      </section>

      <section className="connections-section">
        <div className="section-heading">
          <div><span className="kicker">One platform · four connections</span><h2>What are you <em>looking for?</em></h2></div>
          <p>Choose the kind of person you need. We'll handle the sorting so you can focus on the connection.</p>
        </div>

        <div className="connection-grid">
          {connections.map((item, index) => (
            <Link key={item.title} to={user ? "/questionnaire" : "/register"} className={`connection-card ${item.tone}`}>
              <div className="connection-number">0{index + 1}</div>
              <div className="connection-icon">{item.icon}</div>
              <div><h3>{item.title}</h3><p>{item.text}</p></div>
              <span className="card-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="how-section">
        <div className="section-heading compact">
          <div><span className="kicker">How it works</span><h2>Simple enough to <em>feel human.</em></h2></div>
          <p>No endless scrolling. Just a few details that make a match meaningful.</p>
        </div>
        <div className="steps">
          <article><span>01</span><h3>Tell us your world</h3><p>Share your interests, personality and the way you like to work.</p></article>
          <article><span>02</span><h3>Choose what you need</h3><p>Answer a short questionnaire for study, projects, roommates or mentors.</p></article>
          <article><span>03</span><h3>Find the overlap</h3><p>See people ranked by compatibility and start a conversation.</p></article>
        </div>
      </section>

      <section className="final-cta">
        <span className="kicker light-kicker">Start somewhere</span>
        <h2>Your next great connection<br /><em>could be here.</em></h2>
        <Link className="btn btn-light" to={user ? "/questionnaire" : "/register"}>Get started <span>→</span></Link>
      </section>
    </div>
  );
}
