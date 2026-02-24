# Contributing to SoukSync

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Protected. |
| `develop` | Integration branch. All features merge here first. |
| `feature/<name>` | New features. Branch from `develop`. |
| `fix/<name>` | Bug fixes. Branch from `develop`. |
| `release/<version>` | Release prep. Branch from `develop`, merge to `main`. |

## Workflow

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. Write tests first (TDD: RED -> GREEN -> REFACTOR).

3. Commit with clear messages:
   ```
   feat: add product catalog API
   fix: handle empty cart on checkout
   refactor: extract auth middleware
   ```

4. Push and open a PR to `develop`. Link the Jira ticket (e.g. SCRUM-19).

5. After review and CI passes, merge to `develop`.

6. Releases: `develop` -> `release/x.y.z` -> `main` (tag).

## Local Development

### Prerequisites

- Docker and Docker Compose
- Python 3.9+ (backend)
- Node.js 20+ (web dashboard)
- Flutter 3.10+ (mobile app, optional)

### Quick Start

```bash
# 1. Start database and Redis
docker compose up -d db redis

# 2. Backend (port 8020)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8020 --reload

# 3. Web dashboard (port 5175)
cd web
npm install
cp .env.example .env.local
npm run dev  # http://localhost:5175

# 4. Mobile (optional)
cd mobile
flutter pub get
flutter run
```

### Or run everything with Docker

```bash
docker compose up
# Backend: http://localhost:8020
# API docs: http://localhost:8020/docs
```

## Running Tests

```bash
# Backend
cd backend && source .venv/bin/activate && pytest -v

# Web
cd web && npx vitest run

# Mobile
cd mobile && flutter test
```

## Code Standards

- **Backend:** Follow `Docs/BACKEND_GUIDELINES.md` — layered architecture, strict types, TDD.
- **Frontend:** Follow `Docs/FRONTEND_GUIDELINES.md` — feature modules, Zustand + TanStack Query.
- **Mobile:** Follow `Docs/MOBILE_GUIDELINES.md` — Clean Architecture, Riverpod, offline-first.
