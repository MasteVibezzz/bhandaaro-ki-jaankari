# Local full-stack contract

The FastAPI service serves the frontend and JSON API on the same origin (port 8000).
PostgreSQL is the source of truth; browser language preference is retained. Existing
browser-only data is left intact but is not silently imported or treated as trusted.
Development seeding is explicit and repeatable. Demo listings remain unverified.

## Data and transactions

- Users: canonical unique email, display name, Argon2 password hash, creation timestamp.
- Sessions: SHA-256 hash of an opaque random token, user FK, UTC expiration timestamp.
  HttpOnly, SameSite=Strict cookie; browser-session cookie by default, 30 days for Remember Me.
  Sign-up starts a session. Sign-out revokes the server record and deletes the cookie.
- Locations: integer ID, owner FK (nullable for demo records), name, editable address,
  coordinates, type, days, timings, description, displayed availability, timestamps,
  demo aggregate counters and the day those counters represent.
- Reviews: location/user FKs, author display name, numeric rating, comment, timestamp.
  Demo reviews are explicitly marked, retain original text and baseline ratings.
- Check-ins: user/location FKs, Asia/Kolkata calendar day, timestamp. One per user,
  location and day. A submitted check-in and its review/activity commit atomically.
- Activity: permanent ID, type, actor/location FKs plus display snapshots and timestamp.
- Write requests: unique user/idempotency key, operation+payload digest and saved result.
  Repeating the same request returns its original result; reusing a key for different
  content returns 409. Location identity also has a unique normalized name/coordinates.

Aggregate counters use demo historical totals plus database check-ins. Today's counter
uses the demo counter only on its seed day, then counts check-ins for the current Pune
day. Rating is the mean of stored review ratings (including marked demonstration reviews).
Availability is a displayed assertion, not inferred from free-text timings.

## Endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /health | Liveness |
| GET | /health/ready | Database readiness |
| POST | /api/auth/register | Name, email, password; starts session |
| POST | /api/auth/login | Email, password, remember |
| GET | /api/auth/me | Current public user, or 401 |
| POST | /api/auth/logout | Revoke current session |
| GET | /api/locations | Optional search, type, status=open/closed |
| GET | /api/locations/{id} | Location, aggregates and reviews |
| POST | /api/locations | Authenticated location creation |
| POST | /api/locations/{id}/checkins | Rating + comment; atomic check-in/review/activity |
| POST | /api/locations/{id}/reviews | Standalone rating + comment; no check-in increment |
| GET | /api/activity | Most recent 20 entries |
| GET | /api/stats | Global location/open/check-in totals |

JSON fields match the frontend's existing camelCase shape. All writes validate the
Origin against the configured allowlist (including login CSRF). API writes use JSON.
Creation/check-in/review require an Idempotency-Key header. CORS permits only explicitly
configured origins with credentials. Secure cookies can be enabled for HTTPS.
Errors use {error: {code, message, fields?}} and appropriate 401/403/404/409/422/429/503.
Password hashes, session tokens and user emails never appear in public activity data.

## Local acceptance gates

1. Docker engine, Compose config, PostgreSQL readiness.
2. Fresh Alembic upgrade, downgrade, re-upgrade in a dedicated test database.
3. Repeat seed leaves 10 locations, 40 seed reviews and 5 activity entries.
4. PostgreSQL API tests cover auth, validation, CSRF, duplicates, transactions and totals.
5. JavaScript tests cover API handling, rendering safety and map lifecycle.
6. Real browser: registration, login/Remember Me, filtering, location picker,
   check-in/review, refresh, second browser session, logout and API failure/retry.
7. Commit, push feature branch, open PR. Main is updated through review.

Production hosting, email verification/recovery, distributed rate limits, moderation
and live availability/geocoding remain follow-up work.
