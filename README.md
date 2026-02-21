# Closet Planner AI (Hackathon MVP)

Closet Planner AI is a full-stack monorepo MVP where users upload closet photos or type what they own, then provide an occasion/itinerary to get 2-4 outfit suggestions in structured JSON.

## Monorepo Structure

```text
/Users/jaydenpiao/Desktop/AI-Closet-Planner
  frontend/
  backend/
  docs/
  SYNC_CONTEXT.md
  README.md
```

## Tech Stack

- Frontend: React + TypeScript + Vite, Tailwind CSS, shadcn/ui
- Backend: FastAPI, Uvicorn, Pydantic, python-multipart, google-genai SDK

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

## 3. Verification Commands

### Health

```bash
curl -sS http://127.0.0.1:8000/api/health
```

Expected:

```json
{"status":"ok"}
```

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
- 4-hour runbook: `docs/HACKATHON_RUNBOOK.md`
- 1-minute demo script: `docs/DEMO_SCRIPT.md`
- Shared dev context: `SYNC_CONTEXT.md`
