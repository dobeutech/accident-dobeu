# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a Fleet Accident Reporting System with three main packages: `backend/` (Node.js/Express API on port 3000), `web/` (React/Vite dashboard on port 5000), and `mobile/` (React Native/Expo, optional). Package manager is **npm**. See `README.md` for full docs and available scripts.

### Services

| Service | Port | How to start |
|---------|------|-------------|
| PostgreSQL | 5432 | `sudo pg_ctlcluster 16 main start` |
| Backend API | 3000 | `cd backend && npm run dev` |
| Web Dashboard | 5000 | `cd web && npm run dev` |

### Non-obvious setup caveats

- **PostgreSQL must be started manually** before the backend: `sudo pg_ctlcluster 16 main start`. It does not auto-start on VM boot.
- **Migration file `001_create_tables.sql` references `heliumdb`** in an `ALTER DATABASE` statement. A database named `heliumdb` must exist in PostgreSQL for migrations to succeed, even though the app data goes into `accident_app`. It was created during initial setup.
- **Three databases are needed**: `accident_app` (dev), `accident_app_test` (tests), and `heliumdb` (migration compatibility). All use the `uuid-ossp` extension.
- **Backend `.env` must be created from `.env.template`** with at least: `DB_PASSWORD`, `JWT_SECRET` (32+ chars), `SESSION_SECRET` (32+ chars), and `ENCRYPTION_KEY` filled in. See `backend/.env.template`.
- **CORS_ORIGIN** in backend `.env` should include `http://localhost:5000` for the Vite dev server proxy to work.
- **Test database needs migrations too**: run `DB_NAME=accident_app_test node src/database/migrate.js` from `backend/`.
- **Seed data**: `cd backend && npm run seed` creates a fleet, admin/manager/driver users, and sample vehicles. Login credentials are printed to stdout.
- **Backend lint has pre-existing errors** (1170 issues). The lint command works (`npm run lint` in `backend/`), but the codebase has existing style violations.
- **Backend tests**: 31/40 pass. Failures are pre-existing (CSRF/assertion mismatches, encryption key format). Run with: `NODE_ENV=test DB_NAME=accident_app_test DB_USER=postgres DB_PASSWORD=postgres JWT_SECRET=<32+chars> SESSION_SECRET=<32+chars> npm test` from `backend/`.
- **Husky commit hooks** enforce conventional commits format (`feat|fix|docs|...`) and run lint-staged on `backend/` JS files.
- **The `/api/auth/register` endpoint** only accepts `fleet_viewer` and `driver` roles, not `super_admin` or `fleet_admin`. Initial admin users must be created via the seed script or direct SQL.
- **Web frontend build**: `cd web && npx vite build` outputs to `web/dist/`. The backend serves this in production mode.
