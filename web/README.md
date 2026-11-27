# Web PWA

This is the HeyLane React/Vite app. It connects to the Express API on port 5000
through Vite's `/api` proxy. Start PostgreSQL and configure `backend/.env` first.

From the repository root:

```powershell
npm run install:all
npm run dev:backend
```

In a second terminal:

```powershell
npm run dev
```

Open http://localhost:5173. Run `npm test` and `npm run build` from the root
for validation. See [the project README](../README.md) for login details.
