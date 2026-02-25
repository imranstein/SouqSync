# AGENTS.md

## Cursor Cloud-specific instructions

**SoukSync** is an asset-light B2B FMCG marketplace monorepo with three main services: a FastAPI backend, a React web dashboard, and a React admin dashboard.

### Services overview

| Service | Port | Dev command | Notes |
|---------|------|-------------|-------|
| PostgreSQL 16 | 5433 | `docker compose up -d db` | Mapped to host port **5433** (not 5432) |
| Redis 7 | 6379 | `docker compose up -d redis` | |
| Backend (FastAPI) | 8020 | `cd backend && source .venv/bin/activate && PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8020 --reload` | |
| Web dashboard | 5175 | `cd web && npm run dev` | |
| Admin dashboard | 5176 | `cd dashboard && npm run dev -- --port 5176` | Default vite config uses 5175 (same as web); use `--port 5176` to avoid conflict |

### Startup sequence

1. Ensure the Docker daemon is running (e.g., `sudo systemctl start docker` or `sudo dockerd &>/dev/null &`). Add your user to the `docker` group so `/var/run/docker.sock` is accessible only to group members: `sudo usermod -aG docker $USER`. Log out and back in (or start a new shell, e.g. `newgrp docker`) for the group membership to take effect.
2. Start infrastructure: `docker compose up -d db redis` (from repo root)
3. Backend: activate venv, run migrations, start uvicorn (see README Quick Start)
4. Web: `cd web && npm run dev`

### Gotchas

- **`pyproject.toml` build-backend typo**: The `build-backend` is set to `hatchling.backends` (should be `hatchling.build`). Editable installs (`pip install -e .`) fail. Workaround: install dependencies directly from the `[project.dependencies]` and `[project.optional-dependencies.dev]` lists, then rely on `PYTHONPATH=.` to make the `app` package importable.
- **Database migrations**: Run `PYTHONPATH=. alembic upgrade head` from `backend/` before first backend start. Seed data: `PYTHONPATH=. python -m app.db.seed`.
- **Backend tests**: `pytest -v` in `backend/` runs the test suite. Unit tests mock the DB layer; integration tests (e.g., health endpoint) make real DB/Redis connectivity checks via the running infrastructure. `PYTHONPATH=.` is not needed for pytest (it adds cwd to `sys.path` automatically) but is still required for `alembic` and `python -m app.db.seed`.
- **Port 5433**: Docker Compose maps PostgreSQL to host port 5433 to avoid conflicts. The backend `.env.example` already reflects this.

### Lint / Test / Build commands

See `README.md` "Running Tests" section. Quick reference:
- Backend lint: `cd backend && source .venv/bin/activate && ruff check app/ tests/`
- Backend tests: `cd backend && source .venv/bin/activate && pytest -v`
- Web lint: `cd web && npx eslint .`
- Web tests: `cd web && npx vitest run`
- Web build: `cd web && npm run build`
- Dashboard lint: `cd dashboard && npx eslint .`
- Dashboard tests: `cd dashboard && npx vitest run`
- Dashboard build: `cd dashboard && npm run build`
