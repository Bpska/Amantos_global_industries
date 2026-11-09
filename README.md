# HeyLane PWA

Standalone React/Vite app for retailer onboarding, orders, collections, and reports.
Data is stored in this browser's localStorage. No backend or database is needed.

## Run locally

Install Node.js 24 or newer, then run these commands in PowerShell:

```powershell
cd D:\New_Logisaar\Amantos_global_industries
npm run install:all
npm run dev
```

Open http://localhost:5173. On later runs, only `npm run dev` is needed.

Both roles use the same login screen:

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin@123` |
| Staff (Created by Admin) | Custom handle | Assigned by Admin |

Admin login opens `/admin` with the executive dashboard, all retailers, products,
team management, invoices, and reports. Staff login opens `/staff` with a personal
dashboard, assigned retailers, orders, collections, and profile. Refresh keeps
the current role signed in. Each role is redirected to its own panel if it opens
the other panel's URL.

## Checks and production build

Run from the repository root:

```powershell
npm test
npm run build
npm run preview
```

The production files are generated in `web/dist/`.

## Project layout

- `web/src/`: application screens, components, and local data service.
- `web/public/`: PWA manifest, service worker, icons, and brand assets.
- `web/tests/`: existing automated tests.
- `docker/`, `Dockerfile.web`, `docker-compose.yml`: optional PWA hosting.
- `.github/workflows/ci.yml`: web build and test checks.

See [DEPLOYMENT.md](DEPLOYMENT.md) for Docker hosting.
