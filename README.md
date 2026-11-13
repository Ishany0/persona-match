# PersonaMatch — Student Compatibility & Connection Platform

PersonaMatch helps university students discover compatible peers for study partnerships, project teams, roommate searches and mentorship. Matching ranks candidates using Jaccard similarity over category-specific tags.

## Current stack
- Frontend: React 18 + React Router
- Backend: Flask REST API
- Database: SQLite (created automatically)
- Password storage: Werkzeug PBKDF2 password hashing
- Email: SMTP-based university email verification and password recovery
- Session: signed, time-limited bearer tokens for protected API routes

## Run locally (Windows)

### 1. Backend
```powershell
cd backend
py -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

### 2. Configure real email delivery
Edit `backend/.env` and set your SMTP credentials. For Gmail, use a Google App Password (not your normal Gmail password), with 2-Step Verification enabled. Keep `.env` private and never upload it to GitHub.

Required settings:
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=your-sender@gmail.com`
- `SMTP_PASSWORD=your-google-app-password`
- `SMTP_FROM=PersonaMatch <your-sender@gmail.com>`
- `APP_BASE_URL=http://localhost:5000`
- `ALLOWED_EMAIL_DOMAIN=thapar.edu`
- Set a long random `SECRET_KEY` before any deployment.
- `FRONTEND_ORIGIN=http://localhost:3000` (change this to your deployed frontend origin).
- Optional frontend build setting: `REACT_APP_API_URL=http://localhost:5000`.

If SMTP is not configured, this is **development mode**: verification/reset links are printed in the backend terminal. No email is actually delivered. This is useful for local testing but is not a production email setup.

The backend loads `backend/.env` automatically using `python-dotenv`.

### 3. Frontend (second terminal)
```powershell
cd frontend
npm install
npm start
```
Open `http://localhost:3000`.

## Authentication and recovery
- Registration accepts only addresses ending exactly in `@thapar.edu`.
- New accounts start as `Unverified`; they cannot log in until the one-time verification link is used.
- Verification links expire after 24 hours and are single-use.
- Duplicate email addresses are rejected by both application validation and the database UNIQUE constraint.
- Login uses the test-case error text `Invalid credentials` for an incorrect email/password pair.
- Forgot Password sends a one-time reset link; reset links expire after 30 minutes and are single-use.
- Passwords must be at least 8 characters and include letters and numbers.
- Protected profile, questionnaire, match and messaging routes require a signed bearer token. Tokens expire after 12 hours.

## Demo account for the supplied login test case
Run this once against a fresh local database:
```powershell
cd backend
python seed_demo.py
```
Credentials: `student@thapar.edu` / `PersonaMatch@123`.

The seed script marks this test-only account as verified so the login test case can be demonstrated immediately. Do not use demo credentials in a deployed environment.

## Suggested demonstration flow
1. Seed the demo account and demonstrate successful login.
2. Attempt login with `wrong123`; show `Invalid credentials`.
3. Register a new `@thapar.edu` address; show the account is unverified.
4. Open the verification URL printed in the backend terminal (or received by email when SMTP is configured).
5. Try logging in before verification (must be blocked), then after verification (must succeed).
6. Register the same email again (must show `Email already registered`).
7. Use Forgot Password, open the reset URL from email/terminal, set a new password and log in with it.
8. Complete profile and category questionnaire; create a second account and compare matching results.
9. Open a match and demonstrate the messaging flow.

## API overview
- `POST /api/register`
- `GET /api/verify/<token>`
- `POST /api/resend-verification`
- `POST /api/login`
- `POST /api/forgot-password`
- `GET|POST /api/reset-password/<token>`
- `GET|PUT /api/profile/<user_id>` (authenticated)
- `GET /api/categories`
- `POST /api/questionnaire` (authenticated)
- `GET /api/matches/<user_id>/<category>` (authenticated)
- `POST /api/messages` and `GET /api/messages/<user_id>/<other_id>` (authenticated)
- `GET /api/health`

## Important scope notes
This is a local academic demonstration build, not a production deployment. Before public deployment, use HTTPS, a production WSGI server, a strong secret from a secret manager, rate limiting for login/registration/reset endpoints, stronger audit logging, database backups, and a managed database. Messaging currently uses HTTP polling rather than WebSockets. The project report describes moderation/reporting as a system capability, but the supplied codebase does not yet implement an admin moderation dashboard.

## Run the matching-engine unit tests
```powershell
cd backend
python -m unittest discover -s tests -v
```
