# Bhandaaro Ki Jaankari
### भंडारों की जानकारी

A bilingual map-based community food directory for Pune, with a FastAPI backend and PostgreSQL database.

## Current status

This is a local full-stack development version. Users can register and sign in, add locations,
and submit check-ins with ratings and reviews. Data is shared between browser sessions through PostgreSQL.
Passwords use Argon2 hashing; login uses revocable HttpOnly cookie sessions. Browser storage holds
only the language preference. Old browser-only prototype data remains untouched and is not imported.

The ten optional seed listings, forty seed reviews, counters and activity include demonstration data.
Meal schedules and opening status are not verified in real time. Live verification, moderation,
password recovery, email verification and production hosting are future work.

## Quick start with Docker Desktop

Start Docker Desktop, then from this repository:

```bash
docker compose up -d --build
docker compose exec api python -m backend.app.seed
```

Open [http://localhost:8000](http://localhost:8000).
API documentation: [http://localhost:8000/docs](http://localhost:8000/docs).
Liveness: `/health`; database readiness: `/health/ready`.

The seed command is optional and safe to repeat; it does not reset existing data.
The API and database bind to localhost only. PostgreSQL uses host port 5433; the app uses 8000.
An internet connection is needed for the first image download, CDN libraries, icons and map tiles.

```bash
docker compose ps
docker compose logs --tail=50 api
docker compose stop
docker compose start
```

The named `postgres-data` volume retains records across container restarts.
Do not remove that volume if you want to retain your local data.

## Configuration

Compose has local-development defaults. Copy `.env.example` to `.env` if customizing:
`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `ALLOWED_ORIGINS`, `COOKIE_SECURE`.
Keep `.env` private. Changing database credentials after the volume is initialized
also requires changing the database role; environment values do not reset an existing volume.

`DATABASE_URL` is used by a host-run Python process. Compose provides the container URL separately.
The default password is solely for this localhost development stack.
For HTTPS, enable `COOKIE_SECURE=true` and set the exact permitted browser origin.
The frontend uses relative `/api` calls from the same FastAPI origin.
Opening `index.html` or using a standalone static server no longer starts a working full-stack app.

## Optional: host-run Python development

Docker's API uses Python 3.12. The implementation is also tested with the existing macOS Python 3.9.
For a new host environment, use Python 3.12+:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
docker compose up -d db
.venv/bin/alembic -c backend/alembic.ini upgrade head
.venv/bin/python -m backend.app.seed
.venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Run either the host API or the Docker API on port 8000 at a time.
If the Docker API is already running, stop it with `docker compose stop api` first.
To load a customized `.env` with Uvicorn, add `--env-file .env`.
For migration commands with customized configuration, export `DATABASE_URL` in your shell.

## Migrations

```bash
docker compose exec api alembic -c backend/alembic.ini upgrade head
docker compose exec api alembic -c backend/alembic.ini current
docker compose exec api alembic -c backend/alembic.ini check
```

Schema changes use committed Alembic revisions. Never reset development data to apply a migration.
The tests verify upgrade → downgrade → upgrade in a dedicated test database.

## Tests

JavaScript checks require Node.js 22+:

```bash
npm test
```

Create the isolated test databases once (an "already exists" message on later runs is harmless):

```bash
docker compose exec db createdb -U bhandaaro bhandaaro_test
docker compose exec db createdb -U bhandaaro bhandaaro_browser_test
```

For custom database roles, replace `bhandaaro` with your configured user.
Run PostgreSQL-backed API tests inside the Docker runtime:

```bash
docker compose exec -e TEST_DATABASE_URL=postgresql+psycopg://bhandaaro:local-development-only@db:5432/bhandaaro_test api python -m pytest backend/app/tests -q
```

Or use the host environment: `.venv/bin/python -m pytest backend/app/tests -q`.
Override `TEST_DATABASE_URL` for custom credentials. The suite refuses to reset any database
whose name does not end in `_test`. It truncates only the selected test database.

For the real browser suite:

```bash
docker compose --profile test up -d --wait browser-test
npm ci
npx playwright install chromium
npm run test:browser
docker compose --profile test stop browser-test
```

The browser stack is isolated on port 8001 with its own database.
The GitHub Actions workflow repeats API, migration, JavaScript and browser checks for pull requests.
It covers registration/login/logout, Remember Me cookies, API data, filters, map/picker,
check-ins/reviews, new locations, reload, second browser context, and API failure/retry.
It creates uniquely named test accounts and locations in that test database.
Automated browser tests serve local tile fixtures and verify the outgoing Referer and
attribution in both maps. They do not fetch OSM's community-hosted tiles.
`CHROME_PATH` can select an existing Chrome executable; `PLAYWRIGHT_PACKAGE`
can point to an existing Playwright installation. `BASE_URL` overrides the default test URL.

## Architecture

```text
app.js             Shared frontend state and startup
api.js             Credentialed requests, submission locks and retry keys
locations.js       API-backed location and check-in workflows
auth.js            Registration, login, logout, session restoration
ui.js              Rendering, translations and delegated DOM events
map.js             Leaflet main map and coordinate picker lifecycle
translations.js    Hindi and English dictionaries
storage.js         Language preference persistence
backend/
  app/
    main.py        App setup, origin protection, errors and static assets
    config.py      Environment settings
    database.py    SQLAlchemy connection/session management
    models/        Tables and constraints
    schemas/       Validated write payloads
    routers/       Auth and community API endpoints
    services/      Authentication and aggregate/serialization logic
    seed.py        Explicit repeatable development seeding
    tests/         PostgreSQL integration tests
  alembic/         Versioned database migrations
  Dockerfile
  requirements.txt
compose.yaml       Local API, PostgreSQL and optional browser-test stack
docs/backend-contract.md
```

The original `demo-data.js` is retained as the reference fixture. The live frontend never loads it.
The backend seed fixture is `backend/demo-data.json`.
Detailed endpoint and transaction behavior is in [the backend contract](docs/backend-contract.md).

## Behavior and remaining work

- One check-in per user, location and Asia/Kolkata calendar day.
- Check-in, review and activity commit together; standalone reviews do not increment check-in counts.
- Write idempotency keys make retries safe, including concurrent identical requests.
- Remember Me uses a 30-day cookie; unchecked login uses a session cookie with a one-day server expiry.
- Sign-out revokes the current server session. No authentication token is stored in browser storage.
- New locations use your confirmed address and coordinates. There is no live geocoding service.
- Availability remains a displayed assertion rather than a computation from free-text opening hours.
- Both maps use OSM's documented HTTPS tile endpoint with visible linked attribution,
  a cross-origin Referer, and normal browser caching. Do not override the page/layer
  referrer policy with `same-origin` or `no-referrer`, bypass tile caches, prefetch
  regions, or automatically retry blocked tiles. See [the OSM tile policy](https://operations.osmfoundation.org/policies/tiles/).
- A process-local rate limit supports this single-instance local stack. Shared rate limiting,
  email verification/recovery, moderation, backups and production deployment remain planned.

Created by **Manit Bhatia** — [@MasteVibezzz](https://github.com/MasteVibezzz).
