# SYNC_CONTEXT

## Project Goal
Build a reliable hackathon MVP where users provide closet images and/or typed clothing lists, then receive structured outfit suggestions for an occasion + itinerary using a FastAPI backend and React frontend.

## Scope (IN)
- Multi-image closet upload
- Manual clothes text input
- Occasion + itinerary + optional preferences
- Gemini-backed closet analysis and outfit planning
- Stable structured JSON schema
- Frontend rendering for parsed closet + outfit cards
- Loading/error states
- Health endpoint and basic tests
- API contract + runbook + demo docs

## Scope (OUT)
- Virtual try-on image generation
- Authentication
- Database
- Persistent file storage
- Deployment
- Advanced analytics

## Tech Stack
- Frontend: React + TypeScript + Vite, Tailwind CSS, shadcn/ui
- Backend: Python 3.11, FastAPI, Uvicorn, Pydantic, python-multipart, google-genai

## Env Vars

### Backend (`backend/.env`)
- `GEMINI_API_KEY=`
- `GEMINI_MODEL=gemini-2.0-flash`
- `GEMINI_MOCK_MODE=true`
- `MAX_UPLOAD_MB=8`
- `MAX_UPLOAD_FILES=8`
- `ALLOWED_ORIGINS=http://localhost:5173`

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL=http://localhost:8000`

## API Contract Snapshot
- `GET /api/health` -> `{ "status": "ok" }`
- `POST /api/analyze-closet` (multipart)
  - optional `files[]`
  - optional `manual_clothes_text`
  - requires at least one
  - returns `AnalyzeClosetResponse`
- `POST /api/generate-outfits` (JSON)
  - accepts `GenerateOutfitsRequest`
  - returns `GenerateOutfitsResponse` with 2-4 outfits
- Full details: `docs/API_CONTRACT.md`

## Roles (70/30 placeholders)
- Dev A (70): backend API/services/tests/docs contract
- Dev B (30): frontend UI/integration/demo UX

## Branch Plan
- `feat/backend-mvp`
- `feat/frontend-mvp`
- merge backend then frontend into `main`
- every major merge updates this file

## Conventions
- Keep MVP scope strict and deterministic
- Prefer mock mode for reliable demos
- Keep schemas aligned across frontend/backend
- Update this file after major structural/API/status changes
- Avoid committing secrets (`.env` excluded)

## Status Snapshot
- Monorepo scaffold completed
- Backend endpoints implemented (`health`, `analyze-closet`, `generate-outfits`)
- Backend Gemini service + prompt templates + mock mode implemented
- Backend validation implemented (required input, MIME/type, file size, file count)
- Backend tests passing (`4 passed`)
- Frontend implemented with Tailwind + shadcn component set
- Frontend API integration implemented (analyze -> generate flow)
- Demo data button implemented
- Frontend lint and production build passing
- Live API verification complete (`health`, CORS, analyze, generate) in mock mode
- Docs completed (`README`, API contract, runbook, demo script)

## Blockers
- Active: none
- Resolved:
  - Pytest import path issue (`ModuleNotFoundError: app`) fixed with `backend/pytest.ini`
  - Tailwind init failed under v4; pinned to Tailwind v3.4 for stable shadcn workflow
  - Shell default node version was older; used Node 24 path for frontend commands

## Next 3 Tasks
1. Optional: add small frontend integration/e2e test for demo button + render assertions
2. Optional: improve mock outfit generator to avoid duplicate category fallback pieces
3. Optional: switch to real Gemini mode and validate multimodal image path with sample photos

## Quick Test Commands

```bash
# Backend
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/backend
source .venv/bin/activate
pytest -q
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Frontend
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/frontend
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npm run lint
npm run build
npm run dev

# API smoke
curl -sS http://127.0.0.1:8000/api/health
curl -sS -X POST http://127.0.0.1:8000/api/analyze-closet -F 'manual_clothes_text=white tee, navy chinos'
```

## Change Log
- [2026-02-21 11:53 PST] codex | scaffolded monorepo root folders/files | establish required repo structure | root tree present
- [2026-02-21 11:58 PST] codex | installed Python 3.11 via Homebrew | satisfy backend runtime requirement | `python3.11 --version` = 3.11.14
- [2026-02-21 12:01 PST] codex | implemented backend API/services/tests | deliver MVP backend + mock Gemini fallback | endpoint curls + pytest pass
- [2026-02-21 12:05 PST] codex | implemented frontend UI/types/api integration | deliver MVP UX and render pipeline | `npm run lint` + `npm run build` pass
- [2026-02-21 12:07 PST] codex | completed docs and consolidated shared context | handoff-ready sprint documentation | docs files present and linked from README
- [2026-02-21 12:12 PST] codex | aligned `files[]` upload contract and reran live checks | enforce exact API field requirement + verify end-to-end readiness | pytest/lint/build/health/CORS/analyze/generate all pass
