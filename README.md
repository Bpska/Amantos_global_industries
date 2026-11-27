# HeyLane PWA

Standalone React/Vite app for retailer onboarding, orders, collections, and reports.
The browser app connects to the Express API on port 5000 and stores business data
in PostgreSQL. Browser storage keeps the sign-in token and profile.

## Run locally

Install Node.js 24 or newer, then run these commands in PowerShell:

```powershell
cd E:\Amantos_global_industries
npm run install:all
npm run dev:backend
```

Configure `backend/.env` using `backend/.env.example` and start PostgreSQL first.
For a new database, run `npm --prefix backend run prisma:push` and
`npm --prefix backend run seed` once. Seeding updates the configured admin password.

In a second terminal, start the frontend:

```powershell
npm run dev
```

Open http://localhost:5173 for the app. Port 5000 serves the API and Swagger
documentation at http://localhost:5000/api/docs. Both services must be running.

Both roles use the same login screen:

| Role | Username | Password |
| --- | --- | --- |
| Admin | `ADMIN_SEED_USERNAME` (default `admin`) | `ADMIN_SEED_PASSWORD` from `backend/.env` |
| Staff (Created by Admin) | Custom handle | Assigned by Admin |

Admin login opens `/admin` with the executive dashboard, all retailers, products,
team management, invoices, and reports. Staff login opens `/staff` with a personal
dashboard, assigned retailers, orders, collections, and profile. Refresh keeps
the current role signed in after the API validates the session. Expired or legacy
offline tokens return to sign-in. Connection failures show a retry screen and
preserve the stored token. Each role is redirected to its own panel if it opens
the other panel's URL.

## Checks and production build

Run from the repository root:

```powershell
npm test
npm --prefix backend test
npm run build
npm --prefix backend run build
npm run preview
```

The production files are generated in `web/dist/`.

## Project layout

- `web/src/`: application screens, components, API client, and session handling.
- `backend/`: Express API, Prisma schema, and PostgreSQL data services.
- `web/public/`: PWA manifest, service worker, icons, and brand assets.
- `web/tests/`: existing automated tests.
- `docker/`, `Dockerfile.web`, `docker-compose.yml`: optional PWA hosting.
- `.github/workflows/ci.yml`: web build and test checks.

See [DEPLOYMENT.md](DEPLOYMENT.md) for Docker hosting.
