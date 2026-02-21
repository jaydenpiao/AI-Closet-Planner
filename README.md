# Closet Planner AI (Hackathon MVP)

Closet Planner AI is a full-stack monorepo MVP where users upload closet photos or type what they own, then provide an occasion/itinerary to get 2-4 outfit suggestions in structured JSON.

## Monorepo Structure

```text
/Users/jaydenpiao/Desktop/AI-Closet-Planner
  frontend/
  backend/
  supabase/
  docs/
  SYNC_CONTEXT.md
  README.md
```

## Tech Stack

- Frontend: React + TypeScript + Vite, Tailwind CSS, shadcn/ui
- Backend: FastAPI, Uvicorn, Pydantic, python-multipart, google-genai SDK, Supabase (Auth + Postgres + Storage)

## Prerequisites

- Python 3.11+
- Node.js 24+ (recommended for current Vite version)
- npm

## 1. Backend Setup

```bash
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/backend
cp .env.example .env
```

Edit `backend/.env`:

- Keep `GEMINI_MOCK_MODE=true` for reliable demo mode
- Optionally set `GEMINI_API_KEY` and switch `GEMINI_MOCK_MODE=false` for real Gemini
- Add Supabase settings for authenticated features:
  - `SUPABASE_URL=https://<project-ref>.supabase.co`
  - `SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
  - `SUPABASE_SERVICE_ROLE_KEY=...` (server-only secret)
  - `SUPABASE_DB_URL=postgresql://...` (optional for DB tooling)
  - `SUPABASE_STORAGE_BUCKET=closet-item-images`

Install and run:

```bash
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend API base URL: `http://127.0.0.1:8000`

## 2. Frontend Setup

```bash
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/frontend
cp .env.example .env
```

Edit `frontend/.env`:

- `VITE_API_BASE_URL=http://localhost:8000`
- `VITE_SUPABASE_URL=https://<project-ref>.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`

If your shell defaults to an older Node version, export Node 24 path first:

```bash
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
```

Install and run:

```bash
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## 3. Supabase Setup (Auth + DB + Storage)

1. Apply SQL migration in `supabase/migrations/20260221143000_auth_closet_v1.sql`.
2. Confirm tables in `public`:
   - `profiles`
   - `closet_items`
   - `saved_outfits`
3. Confirm storage bucket exists:
   - `closet-item-images` (private)
4. In Supabase Authentication settings:
   - Enable Email provider
   - Disable email confirmation for MVP
   - Enable Google provider and set localhost redirect/origin values

Detailed migration workflow: `docs/SUPABASE_MIGRATION_RUNBOOK.md`
Detailed Google OAuth local setup (exact dashboard/client fields): `docs/GOOGLE_OAUTH_LOCAL_SETUP.md`

## 4. Verification Commands

### Health

```bash
curl -sS http://127.0.0.1:8000/api/health
```

Expected:

```json
{"status":"ok"}
```

### Google Provider Preflight

```bash
curl -i "https://kkicdnsqwvqjlsrsrvxl.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A5173"
```

Expected after provider setup:

- HTTP `302` or `303`
- `location` header pointing to Google auth

### Analyze Closet (manual text path)

```bash
curl -sS -X POST http://127.0.0.1:8000/api/analyze-closet \
  -F 'manual_clothes_text=white tee, blue jeans, brown loafers, navy blazer'
```

### Generate Outfits (mock mode)

```bash
cat <<'EOF_PAYLOAD' >/tmp/generate_payload.json
{
  "closet_items": [
    {
      "id": "manual-1",
      "name": "white tee",
      "category": "top",
      "color": "white",
      "material": null,
      "pattern": null,
      "formality": "casual",
      "seasonality": ["spring", "summer"],
      "tags": ["manual-input"],
      "notes": null
    },
    {
      "id": "manual-2",
      "name": "blue jeans",
      "category": "bottom",
      "color": "blue",
      "material": null,
      "pattern": null,
      "formality": "casual",
      "seasonality": ["spring", "summer"],
      "tags": ["manual-input"],
      "notes": null
    }
  ],
  "occasion": "Business casual meetup",
  "itinerary": "Coworking then dinner",
  "preferences": "Prefer neutral colors"
}
EOF_PAYLOAD

curl -sS -X POST http://127.0.0.1:8000/api/generate-outfits \
  -H 'Content-Type: application/json' \
  --data @/tmp/generate_payload.json
```

### Schema-Valid Smoke (analyze + generate)

```bash
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/backend
source .venv/bin/activate
python - <<'PY'
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import AnalyzeClosetResponse, GenerateOutfitsResponse

client = TestClient(app)

analyze_response = client.post(
    "/api/analyze-closet",
    data={"manual_clothes_text": "white tee, navy chinos, brown loafers"},
)
analyze_payload = AnalyzeClosetResponse.model_validate(analyze_response.json())

generate_response = client.post(
    "/api/generate-outfits",
    json={
        "closet_items": [item.model_dump(mode="json") for item in analyze_payload.items],
        "occasion": "Business casual meetup",
        "itinerary": "Coworking then dinner",
        "preferences": "Prefer neutral colors",
    },
)
generate_payload = GenerateOutfitsResponse.model_validate(generate_response.json())

print("analyze_status", analyze_response.status_code, "items", len(analyze_payload.items))
print("generate_status", generate_response.status_code, "outfits", len(generate_payload.outfits))
PY
```

### Backend tests

```bash
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/backend
source .venv/bin/activate
pytest -q
```

### Frontend lint/build

```bash
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/frontend
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npm run lint
npm run build
```

## API and Sprint Docs

- API contract: `docs/API_CONTRACT.md`
- Supabase migration runbook: `docs/SUPABASE_MIGRATION_RUNBOOK.md`
- Google OAuth local setup: `docs/GOOGLE_OAUTH_LOCAL_SETUP.md`
- 4-hour runbook: `docs/HACKATHON_RUNBOOK.md`
- 1-minute demo script: `docs/DEMO_SCRIPT.md`
- Shared dev context: `SYNC_CONTEXT.md`
