# PersonaMatch

A peer-matching platform for campus communities - find a study partner, project
teammate, roommate, or mentor based on actual compatibility instead of scrolling
through WhatsApp groups.

This is the MVP prototype: register -> build a profile -> answer a short
category questionnaire -> get a ranked list of matches (Jaccard similarity over
tags) -> message them in-app.

## Stack

- **Backend:** Flask + SQLite (`backend/`)
- **Frontend:** React, bootstrapped like Create React App (`frontend/`)

## Running it locally

You need two terminals open - one for the backend, one for the frontend.

### 1. Backend

```bash
cd backend
python -m venv venv          # optional but recommended
source venv/bin/activate     # on Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

This starts the API on **http://localhost:5000** and creates `personamatch.db`
in the `backend/` folder the first time it runs (no manual DB setup needed).

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

This opens the app at **http://localhost:3000**. It talks to the backend on
port 5000, so make sure that's already running (CORS is enabled in `app.py`
for local dev).

## Trying it out

1. Go to `http://localhost:3000` and click **Register** (any email with an `@`
   works for now - real university-email verification is a later item).
2. Fill in your profile (bio, interests, personality tags).
3. Go to **Questionnaire**, pick a category (Study Partner / Project Teammate /
   Roommate / Mentor), and add a few tags describing what you're looking for.
4. Open a second browser (or an incognito window) and register a second
   account, then fill out the same category with some overlapping tags.
5. Go to **Matches** on either account - you should see the other user with a
   match score, and can click **Message** to open a chat.

## Project layout

```
persona-match/
├── backend/
│   ├── app.py            # Flask routes (auth, profile, questionnaire, matches, messages)
│   ├── matching.py        # Jaccard similarity + ranking logic
│   └── requirements.txt
└── frontend/
    ├── public/
    └── src/
        ├── api.js         # fetch wrapper for the backend API
        ├── App.js          # routes
        ├── components/
        │   └── Navbar.js
        └── pages/
            ├── Home.js
            ├── Register.js
            ├── Login.js
            ├── Profile.js
            ├── Questionnaire.js
            ├── Matches.js
            └── Chat.js
```

## Known limitations (MVP scope)

- Auth is intentionally basic - no real sessions/JWT yet, the frontend just
  holds the logged-in user in `localStorage`.
- No university-email domain allowlist yet, just a basic format check.
- Messaging is polled every 3 seconds rather than using websockets.
- No reporting/moderation dashboard yet - that's a subsequent-iteration item.

## Roadmap (from the project proposal)

- Additional categories and better questionnaire UX
- Reporting/moderation dashboard for admins
- SkillSwap AI: complementary-skill matching mode (teach X / learn Y) reusing
  this same matching engine
- Points/coins engagement system once there's a real user base
