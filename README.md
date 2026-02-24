# SouqSync

> **Marketplace sync and operations platform.**  
> *(This README is a living document and will be updated as the project evolves.)*

---

## Overview

SouqSync is a product and codebase for syncing, managing, and operating marketplace and multi-channel commerce workflows. The project is governed by an **EPIC** (product/requirements) source of truth and uses structured memory and agent rules for consistency and continuity.

**Status:** Early stage / in development.  
**Repository:** (Add link when published.)

---

## What’s in This Repo

- **Application code** — Backend (FastAPI) and frontends (React dashboard, Flutter mobile, WhatsApp bot) for the SouqSync product.
- **EPIC alignment** — Requirements, data model, API specs, and user stories are defined in EPIC and referenced by agents and docs.
- **Agent and tooling config** — Cursor/Windsurf rules, skills, and MCP usage (see [AGENTS.md](#agents-and-ai) below). *Note: `AGENTS.md` and `Docs/` are gitignored by default; adjust `.gitignore` if you want them tracked.*

---

## Quick Start

*(To be filled: prerequisites, clone, env setup, migrations, seeders, run backend/frontend.)*

```bash
# Example – update with real commands
# git clone <repo-url>
# cd SouqSync
# Backend: uv sync (or pip install -r requirements.txt), cp .env.example .env, alembic upgrade head
# uvicorn main:app --reload  # or python -m app.main
# Frontend: npm install && npm run dev (React dashboard)
```

---

## Tech Stack

*(Summarise from EPIC/getTechStack and update as locked in.)*

| Layer      | Technology |
|-----------|------------|
| Backend   | Python 3.11+, FastAPI, SQLAlchemy 2.0 |
| Frontend  | React (dashboard), Flutter (mobile), WhatsApp bot (webhook) |
| API       | REST, OpenAPI/Swagger, async (uvicorn) |
| Database  | PostgreSQL 16, Redis |
| Workers   | Celery (background tasks) |
| Tooling   | EPIC MCP (`epic-souksync`), Cursor/Windsurf |

---

## Project Structure

*(Outline main directories; expand later.)*

```
SouqSync/
├── backend/          # FastAPI app (api/, core/, db/, main.py, etc.)
├── frontend/         # React dashboard (or equivalent)
├── mobile/           # Flutter app (if present)
├── docs/ or Docs/    # Design, SRS, memory-bank (gitignored by default)
├── .cursor/          # Cursor rules and skills (gitignored by default)
├── .gitignore
└── README.md         # This file
```

*(See `Docs/BACKEND_GUIDELINES.md` for FastAPI structure; add more detail as the codebase grows.)*

---

## Configuration and Environment

- Copy `.env.example` to `.env` and set:
  - App key, debug, log level
  - Database connection and credentials
  - Any queue, cache, and external service keys (e.g. marketplaces, EPIC API if used at runtime)
- Do not commit `.env` or secrets. See `.gitignore`.

---

## Development Workflow

1. **EPIC first** — For data model, APIs, and user stories, follow the EPIC data model, API specs, and user stories (via MCP or exported docs).
2. **Conventions** — FastAPI (async, `Depends()`, Pydantic); see `Docs/BACKEND_GUIDELINES.md`. Frontend: React (dashboard), Flutter (mobile).
3. **Testing** — *(Add: how to run PHPUnit, frontend tests, and any E2E.)*
4. **Branching / PRs** — *(Add: main vs develop, PR rules, Jira linkage if used.)*

---

## Agents and AI

This project uses:

- **EPIC MCP server** (`epic-souksync`) for project overview, PRD, tech stack, data model, API specs, user stories, and diagrams.
- **EPIC Memory Bank** for persistent context (getMemories, searchMemoriesSemantic, saveMemory, etc.).
- **Cursor (and optionally Windsurf)** with rules and skills that enforce EPIC checks and memory usage.

Agent-facing rules and detailed instructions live in **AGENTS.md**. That file is currently listed in `.gitignore`; if you want it in version control, remove `AGENTS.md` from `.gitignore`.

---

## Documentation

- **In-repo** — This README; add architecture, API, and runbooks under a `docs/` or `Docs/` folder as needed. *(Note: `Docs/` and `docs/` are in `.gitignore` by default.)*
- **EPIC** — Product and technical context (PRD, data model, API specs, user stories) are the source of truth; sync key decisions back into EPIC memory and docs when relevant.

---

## Contributing and License

*(To be added: contribution guidelines, code of conduct, license.)*

---

## Changelog and Roadmap

*(Link or summarise: roadmap, releases, and a changelog if maintained.)*

---

*Last updated: placeholder. Update this README as the project and setup steps are finalised.*
