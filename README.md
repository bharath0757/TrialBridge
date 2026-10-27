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

Target: https://trialbridge-in-5443.web.app

To publish the frontend while the backend is pending, run `./scripts/deploy-frontend.ps1`. This uses `firebase.frontend.json` and returns an explicit unavailable-service response for `/api/**`; sign-in and registration remain unavailable until the real API is connected.

For a backend on Render or another HTTPS host, run `./scripts/deploy-frontend.ps1 -ApiUrl https://YOUR-BACKEND-HOST/api`. Set `CORS_ORIGINS` on that backend to include the Firebase Hosting origin. This rebuilds the frontend with the supplied API URL and uses notification polling.

The Firebase project had no Cloud Run service at inspection. Before a full deployment:

- Configure Google Cloud billing and the Cloud Run, Cloud Build, Artifact Registry, and Secret Manager APIs.
- Rotate the previously embedded database password and JWT signing secret. Store replacements in Secret Manager as `trialbridge-mongodb-uri` and `trialbridge-jwt-secret`. Give the runtime identity access only to those secrets and configure database network access.
- Authenticate `gcloud` and `firebase` to project `trialbridge-in-5443`.
- Run `./scripts/deploy.ps1` from the repository root. It deploys `trialbridge-api` in `us-central1`, checks database readiness, then builds and deploys Hosting. Failures stop the release.

The `/api/**` Cloud Run rewrite must precede the SPA fallback. `VITE_API_URL` may instead specify a separate backend's full `/api` URL. `VITE_WS_URL` is an optional direct WebSocket URL; without it hosted deployments use notification polling.

Never deploy `tests/e2e_server.py`. Production runs `app.main:app`.

## Verification and limits

Run `npm test`, `npm run typecheck`, `npm run build` in the frontend and `python -m pytest -q` in the backend. GitHub Actions also runs Chromium sign-in/reload for all five roles, mobile participant registration, and malformed API response regressions against an isolated test database.

Local verification passed 8 frontend regression tests and all 26 backend tests, including HTTP integration tests. The TypeScript production build passed. Browser verification passed sign-in, reload, and malformed-data recovery for all five roles, mobile participant registration, and rejection of fake sessions when the API is unavailable. Live database persistence requires verification after backend provisioning.

Existing repository-wide lint debt remains (baseline: 206 errors and 13 warnings). Several dashboards, charts, simulations, and help/profile views still contain illustrative data or placeholder behavior. This is a prototype, not a claim that all features are validated for clinical production use.

This clean source snapshot excludes secrets, generated builds, caches, local IDE settings, and the original repository history that contained credentials.
