# SoukSync

> Asset-light B2B FMCG marketplace and embedded BNPL platform for Ethiopia's informal retail network.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.9+, FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 16, Redis 7 |
| Web Dashboard | React 18, TypeScript, Vite, TailwindCSS, Zustand, TanStack Query |
| Mobile | Flutter 3.10+, Riverpod, Clean Architecture, Hive (offline) |
| Integrations | Telegram Bot API, M-Pesa, Telebirr |
| CI | GitHub Actions |

## Project Structure

```
SouqSync/
├── backend/            # FastAPI (port 8020)
│   ├── app/            # Application code (api/, core/, models/, services/, etc.)
│   ├── tests/          # pytest (unit + integration)
│   ├── alembic/        # Database migrations
│   └── pyproject.toml
├── web/                # React dashboard (port 5175)
│   ├── src/            # Features, shared, routes, stores
│   └── package.json
├── mobile/             # Flutter app
│   ├── lib/            # Clean Architecture (core/, features/, l10n/)
│   └── pubspec.yaml
├── docker-compose.yml  # PostgreSQL 16, Redis 7, backend
├── .github/workflows/  # CI for backend, web, mobile
├── CONTRIBUTING.md     # Branch strategy, local setup
└── Docs/               # Guidelines, SRS, backlog (gitignored)
```

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d db redis
```

### 2. Backend (port 8020)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
# Run migrations (first time)
PYTHONPATH=. alembic upgrade head
# Seed sample data (first time)
PYTHONPATH=. python -m app.db.seed
uvicorn app.main:app --host 0.0.0.0 --port 8020 --reload
```

**Note:** If port 5432 is in use, the DB runs on 5433. See `.env.example` for `DATABASE_URL`.

API docs (Swagger): http://localhost:8020/docs

**Try in Swagger:** `POST /api/v1/webhooks/telegram` — use "Try it out", set Request body to:
```json
{"update_id": 123456789, "message": {"message_id": 1, "from": {"id": 111, "first_name": "Test"}, "chat": {"id": 111, "type": "private"}, "text": "Hello"}}
```
Expect `200` and `{"ok": true}`; check backend logs for `telegram_update`.  
**Note:** The Telegram bot is not *active* until you set the token and webhook. **→ Step-by-step:** [Docs/ACTIVATE_TELEGRAM_BOT_STEPS.md](Docs/ACTIVATE_TELEGRAM_BOT_STEPS.md) (BotFather, token, HTTPS, setWebhook, test).

### 3. Web dashboard (port 5175)

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:5175

### 4. Mobile (optional, requires Flutter)

```bash
cd mobile
flutter pub get
flutter run
```

### Or all via Docker

```bash
docker compose up
# Backend at http://localhost:8020
```

## Ports

| Service | Port |
|---------|------|
| Backend API | 8020 |
| (Reserved) | 8021 |
| Web dev server | 5175 |
| PostgreSQL | 5433 (or 5432 if 5433 in use) |
| Redis | 6379 |

All ports are configurable via environment variables (see `.env.example` files).

## Running Tests

```bash
# Backend
cd backend && pytest -v

# Web
cd web && npx vitest run

# Mobile
cd mobile && flutter test
```

## Documentation

- [BACKEND_GUIDELINES.md](Docs/BACKEND_GUIDELINES.md) — Architecture, API design, TDD
- [FRONTEND_GUIDELINES.md](Docs/FRONTEND_GUIDELINES.md) — Components, state, testing
- [MOBILE_GUIDELINES.md](Docs/MOBILE_GUIDELINES.md) — Clean Architecture, offline-first
- [CONTRIBUTING.md](CONTRIBUTING.md) — Branch strategy, workflow

## License

Private. All rights reserved.
