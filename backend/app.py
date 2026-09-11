# app.py
# PersonaMatch backend - Flask + SQLite
#
# This is the MVP backend for PersonaMatch. It handles:
#   - registration / login (basic, no real session/JWT security yet)
#   - profile creation
#   - category questionnaires (Study Partner, Project Teammate, Roommate, Mentor)
#   - matching engine (Jaccard similarity, see matching.py)
#   - basic in-app messaging
#
# NOTE: auth here is intentionally simple for the prototype stage - we just
# return the user's id after login and the frontend keeps it in localStorage.
# Definitely needs real sessions/JWT before this goes anywhere near production.

import os
import sqlite3
import json
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from matching import rank_matches

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "personamatch.db")

CATEGORIES = ["Study Partner", "Project Teammate", "Roommate", "Mentor"]

app = Flask(__name__)
CORS(app)  # frontend runs on a different port during dev, so just allow all for now


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            bio TEXT DEFAULT '',
            interests TEXT DEFAULT '[]',
            personality_tags TEXT DEFAULT '[]',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS personas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            tags TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, category),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            body TEXT NOT NULL,
            sent_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def user_to_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "bio": row["bio"],
        "interests": json.loads(row["interests"] or "[]"),
        "personality_tags": json.loads(row["personality_tags"] or "[]"),
    }


# ---------------------------------------------------------------------
# auth
# ---------------------------------------------------------------------

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are all required"}), 400

    # very basic "university email" check for the prototype - just needs an @
    # and a dot after it. real version should check against a domain allowlist.
    if "@" not in email or "." not in email.split("@")[-1]:
        return jsonify({"error": "please use a valid email address"}), 400

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "an account with this email already exists"}), 409

    pw_hash = generate_password_hash(password)
    cur = conn.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        (name, email, pw_hash),
    )
    conn.commit()
    user_id = cur.lastrowid
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    return jsonify(user_to_dict(row)), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if row is None or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "invalid email or password"}), 401

    return jsonify(user_to_dict(row)), 200


# ---------------------------------------------------------------------
# profile
# ---------------------------------------------------------------------

@app.route("/api/profile/<int:user_id>", methods=["GET"])
def get_profile(user_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    if row is None:
        return jsonify({"error": "user not found"}), 404

    return jsonify(user_to_dict(row)), 200


@app.route("/api/profile/<int:user_id>", methods=["PUT"])
def update_profile(user_id):
    data = request.get_json(force=True)
    bio = data.get("bio", "")
    interests = data.get("interests", [])
    personality_tags = data.get("personality_tags", [])

    conn = get_db()
    row = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None:
        conn.close()
        return jsonify({"error": "user not found"}), 404

    conn.execute(
        "UPDATE users SET bio = ?, interests = ?, personality_tags = ? WHERE id = ?",
        (bio, json.dumps(interests), json.dumps(personality_tags), user_id),
    )
    conn.commit()
    updated = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    return jsonify(user_to_dict(updated)), 200


# ---------------------------------------------------------------------
# category questionnaire + matching
# ---------------------------------------------------------------------

@app.route("/api/categories", methods=["GET"])
def get_categories():
    return jsonify(CATEGORIES), 200


@app.route("/api/questionnaire", methods=["POST"])
def submit_questionnaire():
    data = request.get_json(force=True)
    user_id = data.get("user_id")
    category = data.get("category")
    tags = data.get("tags", [])

    if not user_id or category not in CATEGORIES:
        return jsonify({"error": "user_id and a valid category are required"}), 400

    conn = get_db()
    conn.execute(
        """
        INSERT INTO personas (user_id, category, tags)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, category) DO UPDATE SET tags = excluded.tags
        """,
        (user_id, category, json.dumps(tags)),
    )
    conn.commit()
    conn.close()

    return jsonify({"status": "ok"}), 200


@app.route("/api/matches/<int:user_id>/<string:category>", methods=["GET"])
def get_matches(user_id, category):
    if category not in CATEGORIES:
        return jsonify({"error": "unknown category"}), 400

    conn = get_db()

    mine = conn.execute(
        "SELECT tags FROM personas WHERE user_id = ? AND category = ?",
        (user_id, category),
    ).fetchone()

    if mine is None:
        conn.close()
        return jsonify({"error": "fill out the questionnaire for this category first"}), 400

    my_tags = json.loads(mine["tags"])

    rows = conn.execute(
        """
        SELECT p.user_id, p.tags, u.name, u.bio
        FROM personas p
        JOIN users u ON u.id = p.user_id
        WHERE p.category = ? AND p.user_id != ?
        """,
        (category, user_id),
    ).fetchall()
    conn.close()

    candidates = []
    for r in rows:
        candidates.append({
            "user_id": r["user_id"],
            "name": r["name"],
            "bio": r["bio"],
            "tags": json.loads(r["tags"]),
        })

    ranked = rank_matches(my_tags, candidates)
    return jsonify(ranked), 200


# ---------------------------------------------------------------------
# messaging (basic - no websockets yet, frontend just polls)
# ---------------------------------------------------------------------

@app.route("/api/messages", methods=["POST"])
def send_message():
    data = request.get_json(force=True)
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    body = (data.get("body") or "").strip()

    if not sender_id or not receiver_id or not body:
        return jsonify({"error": "sender_id, receiver_id and body are required"}), 400

    conn = get_db()
    conn.execute(
        "INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)",
        (sender_id, receiver_id, body),
    )
    conn.commit()
    conn.close()

    return jsonify({"status": "sent"}), 201


@app.route("/api/messages/<int:user_id>/<int:other_id>", methods=["GET"])
def get_conversation(user_id, other_id):
    conn = get_db()
    rows = conn.execute(
        """
        SELECT sender_id, receiver_id, body, sent_at FROM messages
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY sent_at ASC
        """,
        (user_id, other_id, other_id, user_id),
    ).fetchall()
    conn.close()

    messages = [
        {
            "sender_id": r["sender_id"],
            "receiver_id": r["receiver_id"],
            "body": r["body"],
            "sent_at": r["sent_at"],
        }
        for r in rows
    ]
    return jsonify(messages), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()}), 200


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
