# PersonaMatch backend — Flask REST API + SQLite.
# Includes verified university registration, password recovery, signed bearer
# sessions, profiles, category questionnaires, Jaccard matching and messaging.
# This is an academic demo build; review README.md before public deployment.

import os
import sqlite3
import json
import hashlib
import secrets
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from functools import wraps
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from dotenv import load_dotenv

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from matching import rank_matches

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))
DB_PATH = os.path.join(BASE_DIR, "personamatch.db")

CATEGORIES = ["Study Partner", "Project Teammate", "Roommate", "Mentor"]

# --- email verification config (all overridable through environment variables) ---
# APP_BASE_URL is the address the verification link points to (this backend, or the frontend
# if it forwards the token to /api/verify/<token>).
APP_BASE_URL = os.environ.get("APP_BASE_URL", "http://localhost:5000")
VERIFICATION_TOKEN_HOURS = 24
RESET_TOKEN_MINUTES = 30
ALLOWED_EMAIL_DOMAIN = os.environ.get("ALLOWED_EMAIL_DOMAIN", "thapar.edu").lower().strip()
SECRET_KEY = os.environ.get("SECRET_KEY", "development-only-change-this-secret")
serializer = URLSafeTimedSerializer(SECRET_KEY, salt="personamatch-session")
STATUS_UNVERIFIED = "Unverified"
STATUS_VERIFIED = "Verified"
# if SMTP_HOST is not set, emails are not sent: the link is printed in the server console (dev mode)
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER or "no-reply@personamatch.local")

app = Flask(__name__)
allowed_origins = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000").split(",")
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})



#databases - 3 tables
# users , personas and messages
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row    #so rows can be accessed like dicts (row["name"])
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

    ensure_user_verification_columns()   # upgrades an already existing personamatch.db too


def ensure_user_verification_columns():
    """Adds the email-verification columns to the users table if they are missing.
    Done with ALTER TABLE (instead of editing CREATE TABLE) so an existing database keeps its data.
    Accounts that already existed before this change are treated as Verified so they can still log in."""
    conn = get_db()
    existing_cols = {r["name"] for r in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "status" not in existing_cols:
        conn.execute("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'Verified'")
    if "verification_token_hash" not in existing_cols:
        conn.execute("ALTER TABLE users ADD COLUMN verification_token_hash TEXT")
    if "verification_expires_at" not in existing_cols:
        conn.execute("ALTER TABLE users ADD COLUMN verification_expires_at TEXT")
    if "reset_token_hash" not in existing_cols:
        conn.execute("ALTER TABLE users ADD COLUMN reset_token_hash TEXT")
    if "reset_expires_at" not in existing_cols:
        conn.execute("ALTER TABLE users ADD COLUMN reset_expires_at TEXT")
    conn.commit()
    conn.close()


def issue_access_token(user_id):
    return serializer.dumps({"user_id": int(user_id), "purpose": "access"})


def require_auth(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "Please log in to continue"}), 401
        try:
            payload = serializer.loads(header[7:], max_age=12 * 60 * 60)
            if payload.get("purpose") != "access":
                raise BadSignature("invalid token purpose")
            request.user_id = int(payload["user_id"])
        except (BadSignature, SignatureExpired, KeyError, TypeError, ValueError):
            return jsonify({"error": "Your session has expired. Please log in again."}), 401
        if "user_id" in kwargs and int(kwargs["user_id"]) != request.user_id:
            return jsonify({"error": "You cannot access another user's account"}), 403
        return fn(*args, **kwargs)
    return wrapped


def hash_token(token):
    # only the hash of the token is stored, so a DB leak does not expose usable verification links
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def issue_verification_token(conn, user_id):
    """Creates a fresh one-time token for the user, stores its hash + expiry, returns the raw token."""
    token = secrets.token_urlsafe(32)
    expires = (datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_HOURS)).isoformat()
    conn.execute(
        "UPDATE users SET verification_token_hash = ?, verification_expires_at = ? WHERE id = ?",
        (hash_token(token), expires, user_id),
    )
    conn.commit()
    return token


def send_verification_email(to_email, token):
    link = f"{APP_BASE_URL}/api/verify/{token}"
    if not SMTP_HOST:
        # dev mode: no mail server configured, print the link so the flow can still be tested
        print(f"[DEV] verification link for {to_email}: {link}")
        return True

    msg = EmailMessage()
    msg["Subject"] = "Verify your PersonaMatch account"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(
        "Welcome to PersonaMatch!\n\n"
        "Please verify your email by clicking the link below:\n"
        f"{link}\n\n"
        f"This link expires in {VERIFICATION_TOKEN_HOURS} hours."
    )
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            if SMTP_USER:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"[ERROR] could not send verification email to {to_email}: {e}")
        return False


def user_to_dict(row):   #converts a DB row into a JSON-friendly dict
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "bio": row["bio"],
        "interests": json.loads(row["interests"] or "[]"),     #JSON strings back into Python lists.
        "personality_tags": json.loads(row["personality_tags"] or "[]"),
        "status": row["status"],     #Verified / Unverified (email verification)
    }



# auth

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    # name is optional now (registration page only asks for email + password);
    # if it is missing we just use the part of the email before the @
    if not name and email:
        name = email.split("@")[0]

    if not name or not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if not email.endswith("@" + ALLOWED_EMAIL_DOMAIN):
        return jsonify({"error": f"Please use your university email ending in @{ALLOWED_EMAIL_DOMAIN}"}), 400
    if len(password) < 8 or not any(ch.isalpha() for ch in password) or not any(ch.isdigit() for ch in password):
        return jsonify({"error": "Password must be at least 8 characters and contain letters and numbers"}), 400

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "Email already registered"}), 409

    pw_hash = generate_password_hash(password)
    try:
        cur = conn.execute(
            "INSERT INTO users (name, email, password_hash, status) VALUES (?, ?, ?, ?)",
            (name, email, pw_hash, STATUS_UNVERIFIED),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        # two requests with the same email at the same time - the UNIQUE constraint keeps it to one record
        conn.close()
        return jsonify({"error": "Email already registered"}), 409

    user_id = cur.lastrowid
    token = issue_verification_token(conn, user_id)
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    email_sent = send_verification_email(email, token)
    result = user_to_dict(row)
    if not SMTP_HOST:
        result["message"] = "Registration successful. DEV MODE: open the verification link printed in the backend terminal."
    elif email_sent:
        result["message"] = f"Registration successful. A verification email has been sent to {email}"
    else:
        result["message"] = ("Account created, but the verification email could not be sent. "
                             "Please request a new one via /api/resend-verification")
    return jsonify(result), 201


@app.route("/api/verify/<string:token>", methods=["GET"])
def verify_email(token):
    token_hash = hash_token(token)
    conn = get_db()
    row = conn.execute(
        "SELECT id, verification_expires_at FROM users WHERE verification_token_hash = ?",
        (token_hash,),
    ).fetchone()

    expired = False
    if row is not None and row["verification_expires_at"]:
        expired = datetime.utcnow() > datetime.fromisoformat(row["verification_expires_at"])

    if row is None or expired:
        conn.close()
        msg, code = "Verification link is invalid or has expired", 400
    else:
        # mark verified and burn the token so the link cannot be reused
        conn.execute(
            "UPDATE users SET status = ?, verification_token_hash = NULL, verification_expires_at = NULL WHERE id = ?",
            (STATUS_VERIFIED, row["id"]),
        )
        conn.commit()
        conn.close()
        msg, code = "Email verified successfully, please log in", 200

    # a browser (user clicking the link in the mail) gets a small page, API/frontend callers get JSON
    best = request.accept_mimetypes.best_match(["application/json", "text/html"])
    if best == "text/html" and request.accept_mimetypes[best] > request.accept_mimetypes["application/json"]:
        return f"<html><body style='font-family:sans-serif;text-align:center;margin-top:15vh'><h2>{msg}</h2></body></html>", code
    return jsonify({"message": msg} if code == 200 else {"error": msg}), code


@app.route("/api/resend-verification", methods=["POST"])
def resend_verification():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()

    conn = get_db()
    row = conn.execute("SELECT id, status FROM users WHERE email = ?", (email,)).fetchone()
    if row is not None and row["status"] != STATUS_VERIFIED:
        token = issue_verification_token(conn, row["id"])
        send_verification_email(email, token)
    conn.close()

    # same answer whether or not the email exists, so this can't be used to find out who is registered
    return jsonify({"message": "If the account exists and is unverified, a new verification email has been sent"}), 200


def send_password_reset_email(to_email, token):
    link = f"{APP_BASE_URL}/api/reset-password/{token}"
    if not SMTP_HOST:
        print(f"[DEV] password reset link for {to_email}: {link}")
        return True
    msg = EmailMessage()
    msg["Subject"] = "Reset your PersonaMatch password"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(f"Reset your PersonaMatch password using this one-time link (valid for {RESET_TOKEN_MINUTES} minutes):\n{link}\n\nIf you did not request this, ignore this email.")
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            if SMTP_USER:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as exc:
        app.logger.exception("Could not send password reset email: %s", exc)
        return False


@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    conn = get_db()
    row = conn.execute("SELECT id, status FROM users WHERE email = ?", (email,)).fetchone()
    if row and row["status"] == STATUS_VERIFIED:
        token = secrets.token_urlsafe(32)
        expires = (datetime.utcnow() + timedelta(minutes=RESET_TOKEN_MINUTES)).isoformat()
        conn.execute("UPDATE users SET reset_token_hash = ?, reset_expires_at = ? WHERE id = ?", (hash_token(token), expires, row["id"]))
        conn.commit()
        send_password_reset_email(email, token)
    conn.close()
    message = "If a verified account exists for that email, a password reset link has been sent."
    if not SMTP_HOST:
        message += " In local development, check the backend terminal for the reset link."
    return jsonify({"message": message}), 200


@app.route("/api/reset-password/<string:token>", methods=["GET", "POST"])
def reset_password(token):
    if request.method == "GET":
        return """<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><title>Reset PersonaMatch password</title><style>body{font:16px Arial;background:#f6f3fb;display:grid;place-items:center;min-height:100vh}main{background:white;padding:32px;border-radius:18px;max-width:420px;width:85%}input,button{box-sizing:border-box;width:100%;padding:12px;margin:10px 0;border:1px solid #ddd;border-radius:9px}button{background:#6c55a3;color:white;border:0}</style></head><body><main><h2>Choose a new password</h2><form method='post'><label>New password</label><input name='password' type='password' minlength='8' required><label>Confirm password</label><input name='confirm' type='password' minlength='8' required><button>Update password</button></form></main></body></html>"""
    data = request.get_json(silent=True) or request.form
    password, confirm = data.get("password", ""), data.get("confirm", "")
    if len(password) < 8 or not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
        return ("Password must be at least 8 characters and contain letters and numbers", 400)
    if password != confirm:
        return ("Passwords do not match", 400)
    conn = get_db()
    row = conn.execute("SELECT id, reset_expires_at FROM users WHERE reset_token_hash = ?", (hash_token(token),)).fetchone()
    if not row or not row["reset_expires_at"] or datetime.utcnow() > datetime.fromisoformat(row["reset_expires_at"]):
        conn.close()
        return ("This password reset link is invalid or has expired. Request a new one.", 400)
    conn.execute("UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_expires_at = NULL WHERE id = ?", (generate_password_hash(password), row["id"]))
    conn.commit()
    conn.close()
    return "<h2>Password updated successfully. You can now log in to PersonaMatch.</h2>"


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if row is None or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    # right password but the email was never verified -> not allowed in yet
    if row["status"] != STATUS_VERIFIED:
        return jsonify({"error": "Please verify your email before logging in"}), 403

    result = user_to_dict(row)
    result["access_token"] = issue_access_token(row["id"])
    return jsonify(result), 200



# profile

@app.route("/api/profile/<int:user_id>", methods=["GET"])
@require_auth
def get_profile(user_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    if row is None:
        return jsonify({"error": "user not found"}), 404

    return jsonify(user_to_dict(row)), 200


@app.route("/api/profile/<int:user_id>", methods=["PUT"])
@require_auth
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


# category questionnaire + matching

@app.route("/api/categories", methods=["GET"])
def get_categories():
    return jsonify(CATEGORIES), 200


@app.route("/api/questionnaire", methods=["POST"])
@require_auth
def submit_questionnaire():
    data = request.get_json(force=True)
    user_id = data.get("user_id")
    category = data.get("category")
    tags = data.get("tags", [])

    if not user_id or category not in CATEGORIES:
        return jsonify({"error": "user_id and a valid category are required"}), 400
    if int(user_id) != request.user_id:
        return jsonify({"error": "You cannot update another user's questionnaire"}), 403

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
@require_auth
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


# messaging (basic - no websockets yet, frontend just polls)

@app.route("/api/messages", methods=["POST"])
@require_auth
def send_message():
    data = request.get_json(force=True)
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    body = (data.get("body") or "").strip()

    if not sender_id or not receiver_id or not body:
        return jsonify({"error": "sender_id, receiver_id and body are required"}), 400
    if int(sender_id) != request.user_id:
        return jsonify({"error": "You can only send messages as yourself"}), 403
    if len(body) > 4000:
        return jsonify({"error": "Message is too long (maximum 4000 characters)"}), 400

    conn = get_db()
    conn.execute(
        "INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)",
        (sender_id, receiver_id, body),
    )
    conn.commit()
    conn.close()

    return jsonify({"status": "sent"}), 201


@app.route("/api/messages/<int:user_id>/<int:other_id>", methods=["GET"])
@require_auth
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
