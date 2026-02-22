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
- Supabase Auth (email/password + Google OAuth)
- Persistent closet CRUD per user
- Single primary photo upload per closet item
- Saved outfit snapshots per user

## Scope (OUT)
- Virtual try-on image generation
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
- `SUPABASE_URL=`
- `SUPABASE_PUBLISHABLE_KEY=`
- `SUPABASE_SERVICE_ROLE_KEY=`
- `SUPABASE_DB_URL=`
- `SUPABASE_STORAGE_BUCKET=closet-item-images`

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL=http://localhost:8000`
- `VITE_SUPABASE_URL=`
- `VITE_SUPABASE_PUBLISHABLE_KEY=`

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
- Auth required endpoints:
  - `GET /api/me`
  - `GET|POST|PATCH|DELETE /api/me/closet-items`
  - `POST|DELETE /api/me/closet-items/{item_id}/image`
  - `POST /api/me/generate-outfits`
  - `GET|POST|DELETE /api/me/saved-outfits`
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
- Backend hardening pass completed (Gemini error boundaries, JSON parse guards, retry semantics)
- Mock outfit fallback improved to reduce repeated piece selection when categories are sparse
- Supabase migration applied for v2 (`profiles`, `closet_items`, `saved_outfits`, storage bucket, RLS policies)
- Backend authenticated routes implemented (`/api/me/*` for closet CRUD, item image upload/delete, saved outfits, generation from saved closet)
- Backend auth dependency implemented via Supabase bearer token verification (`/auth/v1/user`)
- Backend contract/integration test coverage expanded (`19 passed`)
- Frontend implemented with Tailwind + shadcn component set
- Frontend API integration implemented (analyze -> generate flow)
- Demo data button implemented
- Frontend hardening pass completed (shared validation util, inline form errors, resilient submit lifecycle, API failure guidance to demo path)
- Frontend tests implemented with Vitest + RTL (`5 passed`)
- Frontend lint and production build passing
- Frontend MVP closeout pass completed (header copy finalized, input/loading/error/results/demo UX re-verified with no contract changes)
- Frontend quality gates re-verified (`npm run lint` + `npm run test:run` + `npm run build` pass)
- Frontend auth/account mode implemented (email/password + Google buttons, guest mode preserved)
- Frontend closet manager + plan-from-saved-closet + saved outfits panels implemented
- Frontend saved outfits panel now displays selected clothing pieces from `outfit_snapshot.pieces` with fallback handling for missing piece data
- Live API verification complete (`health`, CORS, analyze, generate) in mock mode
- Google OAuth preflight validated and currently failing with `Unsupported provider: provider is not enabled` (provider config pending in Supabase dashboard)
- Docs completed (`README`, API contract, runbook, demo script)

## Blockers
- Active:
  - Supabase management branch operations unavailable via current MCP permission context (`list_branches` error); migration applied directly to project.
  - Supabase Google provider is still disabled for project `kkicdnsqwvqjlsrsrvxl`; `/auth/v1/authorize?provider=google` returns HTTP 400 `validation_failed`.
- Resolved:
  - Pytest import path issue (`ModuleNotFoundError: app`) fixed with `backend/pytest.ini`
  - Tailwind init failed under v4; pinned to Tailwind v3.4 for stable shadcn workflow
  - Shell default node version was older; used Node 24 path for frontend commands
  - FastAPI deprecated `HTTP_413_REQUEST_ENTITY_TOO_LARGE`; switched to `HTTP_413_CONTENT_TOO_LARGE`

## Next 3 Tasks
1. Run merged-branch full regression (`backend: pytest -q`, `frontend: lint + test:run + build`) and record results.
2. Perform manual account-mode smoke (sign-in, closet CRUD + image upload, protected generate, save/delete outfit with piece visibility).
3. Resolve any remaining PR review feedback and squash-merge `frontend` into `main`.

## Quick Test Commands

```bash
# Backend
cd /Users/maggiedi/Desktop/AI-Closet-Planner/backend
source .venv/bin/activate
pytest -q
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Frontend
cd /Users/maggiedi/Desktop/AI-Closet-Planner/frontend
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npm run lint
npm run test:run
npm run build
npm run dev

# API smoke
curl -sS http://127.0.0.1:8000/api/health
curl -sS -X POST http://127.0.0.1:8000/api/analyze-closet -F 'manual_clothes_text=white tee, navy chinos'

# Schema-valid smoke
python - <<'PY'
from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import AnalyzeClosetResponse, GenerateOutfitsResponse

client = TestClient(app)
analyze = client.post("/api/analyze-closet", data={"manual_clothes_text": "white tee, navy chinos, loafers"})
analyze_payload = AnalyzeClosetResponse.model_validate(analyze.json())
generate = client.post(
    "/api/generate-outfits",
    json={
        "closet_items": [item.model_dump(mode="json") for item in analyze_payload.items],
        "occasion": "Business casual meetup",
        "itinerary": "Coworking then dinner",
        "preferences": "Prefer neutral colors",
    },
)
GenerateOutfitsResponse.model_validate(generate.json())
print("ok")
PY

# Frontend quality gates
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/frontend
npm run lint
npm run build
```

## Change Log
- [2026-02-21 11:53 PST] codex | scaffolded monorepo root folders/files | establish required repo structure | root tree present
- [2026-02-21 11:58 PST] codex | installed Python 3.11 via Homebrew | satisfy backend runtime requirement | `python3.11 --version` = 3.11.14
- [2026-02-21 12:01 PST] codex | implemented backend API/services/tests | deliver MVP backend + mock Gemini fallback | endpoint curls + pytest pass
- [2026-02-21 12:05 PST] codex | implemented frontend UI/types/api integration | deliver MVP UX and render pipeline | `npm run lint` + `npm run build` pass
- [2026-02-21 12:07 PST] codex | completed docs and consolidated shared context | handoff-ready sprint documentation | docs files present and linked from README
- [2026-02-21 12:12 PST] codex | aligned `files[]` upload contract and reran live checks | enforce exact API field requirement + verify end-to-end readiness | pytest/lint/build/health/CORS/analyze/generate all pass
- [2026-02-21 12:37 PST] codex | hardened frontend validation/states and added Vitest/RTL tests | improve submit resilience and demo UX while keeping API contract stable | `npm run lint` + `npm run test:run` + `npm run build` pass
- [2026-02-21 12:57 PST] codex | closed out frontend MVP UI workstream and finalized header copy | complete frontend ownership scope without backend/API changes | `npm run lint` + `npm run test:run` + `npm run build` pass
- [2026-02-21 12:58 PST] codex | hardened Gemini service parsing/retry/error boundaries + mock outfit fallback | reduce malformed-output failures while preserving contract stability | backend tests expanded and passing (`15 passed`)
- [2026-02-21 12:58 PST] codex | updated API contract + README schema-smoke instructions | improve frontend/backend integration confidence and runbook clarity | docs aligned with current backend behavior
- [2026-02-21 12:58 PST] codex | validated mock-mode backend health/analyze/generate and recorded real-mode gate | satisfy MVP verification checklist without API key | real Gemini smoke skipped (`GEMINI_API_KEY` absent, `GEMINI_MOCK_MODE=true`)
- [2026-02-21 14:26 PST] codex | implemented v2 auth + persistence stack (Supabase-backed `/api/me/*`, frontend account mode, closet CRUD, saved outfits) | deliver non-breaking expansion from guest MVP to authenticated workflow | backend tests `19 passed`, frontend lint/build pass
- [2026-02-21 14:26 PST] codex | applied Supabase migration `auth_closet_v1` and verified tables/RLS/storage policies | establish secure schema baseline for per-user data + item images | `public` tables present, RLS enabled, `closet-item-images` bucket present
- [2026-02-21 15:10 PST] codex | added Google OAuth local setup runbook + provider preflight commands in docs | reduce setup ambiguity and make auth blocker diagnosable in one command | current preflight result confirmed: HTTP 400 `Unsupported provider: provider is not enabled`
- [2026-02-21 15:50 PST] codex | updated saved outfit cards to render selected clothing pieces from snapshots | close account-mode UX gap where saved outfits lacked item-level visibility | frontend lint/build pass on `feat/saved-outfit-piece-details`
- [2026-02-21 16:03 PST] codex | reconciled `frontend` PR #3 with `main` in isolated worktree and resolved merge conflicts | preserve auth/persistence architecture while keeping additive frontend UX/test improvements | merged branch passes conflict scan and is ready for full regression
