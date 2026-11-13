# Additional acceptance tests for the upgraded PersonaMatch build

## TC 1.3 — Reject non-Thapar email
1. Open Register.
2. Enter `student@gmail.com` and a valid password.
3. Submit.
4. Expected: registration is rejected with a message requiring `@thapar.edu`; no user record is created.

## TC 1.4 — Block login before email verification
1. Register a new `@thapar.edu` address.
2. Before opening its verification link, attempt login with the correct password.
3. Expected: `Please verify your email before logging in`; no access token is issued.

## TC 1.5 — Forgot password
1. Open Login and select **Forgot password?**.
2. Enter a verified `@thapar.edu` email.
3. Expected: generic confirmation message is shown; with SMTP configured, a reset email arrives. In local dev mode, the reset URL is printed in the backend terminal.
4. Open the reset URL, enter matching passwords meeting the policy, and submit.
5. Expected: password is updated, reset token is consumed, and the user can log in with the new password.
6. Reopen the same reset URL.
7. Expected: link is rejected as invalid/expired/used.

## TC 1.6 — Protected API and ownership
1. Call a protected profile/questionnaire/matches/messages endpoint without a bearer token.
2. Expected: HTTP 401.
3. Log in as user A and try to read `/api/profile/<user-B-id>` using A's token.
4. Expected: HTTP 403.
