# Hackathon Runbook (4 Hours, 2 Developers)

## Roles (70/30)

- Dev A (70%): backend API, Gemini integration/mock mode, backend tests, API contract
- Dev B (30%): frontend UI, API integration, demo fallback button, UX states, demo polish

## Sprint Sequence

## 00:00-00:20 Setup Gate

1. Verify runtime prerequisites (`python3.11`, `node`, `npm`)
2. Scaffold monorepo folders and boilerplate
3. Install backend dependencies and frontend dependencies
4. Create `.env.example` files and initialize `SYNC_CONTEXT.md`

Gate pass:

- `python3.11 --version` works
- backend/frontend installs complete

## 00:20-01:50 Parallel Build Gate

Dev A:

1. Implement `/api/health`, `/api/analyze-closet`, `/api/generate-outfits`
2. Add schemas, file validation, CORS, Gemini service + prompt templates
3. Add mock mode fallback and backend tests

Dev B:

1. Build input form + results UI in React/TS + Tailwind/shadcn
2. Add typed API client and load/error handling
3. Add "Use demo data" flow

Gate pass:

- backend tests pass
- frontend lint and build pass

## 01:50-03:00 Integration Gate

1. Connect frontend submit path: analyze -> generate
2. Confirm health badge, loading state, error handling
3. Confirm mock-mode responses render end-to-end

Gate pass:

- frontend shows parsed closet + outfit cards from backend mock mode

## 03:00-03:40 Docs Gate

1. Finalize `README.md`
2. Finalize `docs/API_CONTRACT.md`
3. Finalize `docs/HACKATHON_RUNBOOK.md`
4. Finalize `docs/DEMO_SCRIPT.md`

Gate pass:

- clean copy/paste run steps from zero

## 03:40-04:00 QA Buffer Gate

1. Run full verification checklist
2. Fix blocking defects only
3. Update `SYNC_CONTEXT.md` final snapshot

Gate pass:

- all verification checks green or documented with workaround

## Verification Checklist

1. Frontend installs and starts
2. Backend installs and starts on Python 3.11+
3. `/api/health` returns `{ "status": "ok" }`
4. Frontend health call to backend succeeds
5. Mock outfit generation path renders usable results
6. Frontend build passes
7. Backend tests pass
