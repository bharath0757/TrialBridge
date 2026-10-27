# TrialBridge

React/TypeScript clinical research prototype with a FastAPI/MongoDB backend.

## Fixed deployment failure

Firebase previously returned `index.html` for `/api/*`. The dashboard treated HTML as list data and crashed with `t.filter is not a function`. API responses now reject HTML, collections validate arrays, and authentication requires a verified server session. Fake login/registration fallbacks, unsigned demo tokens, default-password bypasses, and embedded database credentials have been removed.

## Run locally

Use Node 22, Python 3.11, and MongoDB.

1. Copy `reseacher/backend/.env.example` to `.env` in that directory. Supply MongoDB access and a unique random `JWT_SECRET` of at least 32 characters.
2. In `reseacher/backend`, create a virtual environment and run `pip install -r requirements-dev.txt`, then `python -m uvicorn app.main:app --reload --port 8000`.
3. In `reseacher/frontend`, run `npm ci` and `npm run dev`.
4. Public registration creates participants. Run `python bootstrap_admin.py` in the backend directory to create the first administrator. It prompts for a password and never overwrites an existing account.

Never run the legacy `seed.py` against a real database; it performs destructive demo seeding. Old demo credentials are no longer accepted.

## Deploy

Frontend: https://trialbridge-in-5443.web.app

Render API: https://trialbridge-api-lrbt.onrender.com

The Render service is `trialbridge-api` in Singapore, deployed from `main`. Its Dashboard is https://dashboard.render.com/web/srv-dbgb9hugekts738e3bl0. It uses the Free compute plan. Configure `MONGODB_URI` and a unique random `JWT_SECRET` of at least 32 characters in the service environment before enabling database-backed operations. Do not commit either value. `MONGODB_DATABASE` is `trialbridge`; `GEMINI_API_KEY` is optional.

The current service is managed directly through Render service settings. Its build command is `cd reseacher/backend && pip install -r requirements.txt` and start command is `cd reseacher/backend && exec uvicorn app.main:app --host 0.0.0.0 --port $PORT`. The existing `render.yaml` is an alternative Blueprint for creating a separate service, not an automatic sync for this service.

CORS allows the two Firebase origins. The tracked `reseacher/frontend/.env.production` contains only the public API URL. Explicit build environment variables override it in CI. Rebuild and publish Firebase with `./scripts/deploy-frontend.ps1`. The frontend uses direct HTTPS API requests and notification polling. A different backend can be supplied with `-ApiUrl https://YOUR-BACKEND-HOST/api`. Passing `-ApiUrl /api` publishes a disconnected frontend with an explicit unavailable-service response.

Readiness is verified at `GET /api/health`, which must return HTTP 200 with `status: ok` and `database_status: connected`. Service startup alone is not proof of working database access. After configuring secrets, enable the Render HTTP health-check path `/api/health` and verify registration, login, session reload, and data persistence from the hosted frontend.

Cloud Run remains an alternative deployment through `scripts/deploy.ps1`. That script requires Google Cloud billing, APIs, authentication, and Secret Manager values. Never deploy `tests/e2e_server.py`; production runs `app.main:app`.

## Verification and limits

Run `npm test`, `npm run typecheck`, `npm run build` in the frontend and `python -m pytest -q` in the backend. GitHub Actions also runs Chromium sign-in/reload for all five roles, mobile participant registration, and malformed API response regressions against an isolated test database.

Local verification passed 11 frontend regression tests and all 48 backend tests, including HTTP integration tests. The TypeScript production build passed. Browser verification passed sign-in, reload, and malformed-data recovery for all five roles, display of real participant appointments, mobile participant registration with an unassigned profile, and rejection of fake sessions when the API is unavailable. Access regressions cover participant and organization isolation, organization privilege escalation, private messages and tasks, and unknown clinical states. Live database persistence requires verification after backend provisioning.

Existing repository-wide lint debt remains (baseline: 206 errors and 13 warnings). Several dashboards, charts, simulations, and help/profile views still contain illustrative data or placeholder behavior. This is a prototype, not a claim that all features are validated for clinical production use.

This clean source snapshot excludes secrets, generated builds, caches, local IDE settings, and the original repository history that contained credentials.
