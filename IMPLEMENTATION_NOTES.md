# PersonaMatch implementation & evaluation notes

## Features completed in this build

| Area | Behaviour to demonstrate |
|---|---|
| Thapar registration | Only `@thapar.edu` email addresses are accepted; duplicate addresses return HTTP 409. |
| Verification | New account is `Unverified`; a 24-hour one-time verification token changes it to `Verified`. |
| Login | Wrong password returns `Invalid credentials`; unverified accounts are blocked; verified accounts receive a 12-hour signed access token. |
| Forgot password | Generic response prevents email/account enumeration; verified users receive a 30-minute, single-use reset link. |
| Protected APIs | Profile, questionnaire, matches and messages require a bearer token; user ID ownership is checked for account-specific routes. |
| Matching | Category-specific tags are compared using Jaccard similarity and ranked descending. |
| Messaging | Users can send and retrieve messages in a conversation; frontend refreshes the conversation periodically. |

## Mapping to supplied test cases

**TC 1.1 — User Login**
- Run `python seed_demo.py` to create `student@thapar.edu` / `PersonaMatch@123` in verified state.
- Wrong password `wrong123` should show `Invalid credentials` and leave the user on Login.
- Correct password should log in and open Matches.

**TC 1.2 — User Registration and Email Verification**
- Register a new `@thapar.edu` email with `PersonaMatch@123`.
- Confirm the account status is `Unverified` in SQLite.
- With SMTP configured, click the email link. Without SMTP, use the one-time URL printed in the backend terminal.
- The verification endpoint responds with `Email verified successfully, please log in`.
- Register the same address again; expect `Email already registered` and HTTP 409.

## Important demo setup details

- Start backend from `backend/` so the local SQLite DB is created there.
- Seed the demo account only after the backend dependencies are installed.
- Real email delivery requires working SMTP credentials. The console-link mode is a local-development fallback and should not be described as an email being delivered.
- Use two distinct Thapar email addresses to demonstrate matching. Both users must verify, complete the same category questionnaire, and use overlapping tags.
- The supplied report mentions an admin moderation/reporting workflow, but the uploaded source code did not contain those modules. They are not represented as implemented in this build.
