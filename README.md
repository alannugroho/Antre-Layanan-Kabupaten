# Sistem Manajemen Antrean

This repository contains:
- Legacy static HTML prototypes in workspace root.
- Runnable React frontend and Node backend in frontend and backend.
- Database schema and seed draft in db.

Primary context document:
- CONTEXT.md

## Run Locally (Laragon + Node)

1. Backend API
- `cd backend`
- `copy .env.example .env`
- `npm install`
- `npm run dev`
- API URL: `http://localhost:3000`

2. Frontend App
- `cd frontend`
- `npm install`
- `npm run dev -- --host`
- Frontend URL: `http://localhost:5173`

3. Optional root command
- From project root: `npm install`
- Run both servers together: `npm run dev`

4. Legacy static prototype pages (served by Laragon)
- `http://localhost/web%20rico/Untitled-1.html`
- `http://localhost/web%20rico/Warga%20-%20Landing%20Page%20Antrean.html`

## Notes
- Backend currently uses in-memory data for quick development; DB integration is next.
- DB schema draft exists in `db/schema/schema.sql`.
