# Google OAuth Local Setup (Supabase) - Closet Planner AI

This runbook fixes this exact error:

```json
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

It means Google auth provider is disabled in Supabase for this project.

## 1. Google Cloud: OAuth Consent Screen

1. Open Google Cloud Console for the project you will use for login.
2. Go to `APIs & Services -> OAuth consent screen`.
3. User type: `External` (for local MVP).
4. Fill required app fields.
5. If app status is Testing, add your own Google account under Test users.

## 2. Google Cloud: Create Web OAuth Client

1. Go to `APIs & Services -> Credentials -> Create Credentials -> OAuth client ID`.
2. Application type: `Web application`.
3. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
4. Authorized redirect URIs:
   - `https://kkicdnsqwvqjlsrsrvxl.supabase.co/auth/v1/callback`
5. Save and copy:
   - `Client ID`
   - `Client Secret`

## 3. Supabase Dashboard: Enable Google Provider

1. Open `Authentication -> Providers -> Google`.
2. Turn on `Enable Sign in with Google`.
3. Set `Client IDs` to the Google Web Client ID.
4. Set `Client Secret (for OAuth)` to the Google Client Secret.
5. Save.

Note: `OAuth Server` toggle is unrelated and can stay disabled.

## 4. Supabase Dashboard: URL Configuration

1. Open `Authentication -> URL Configuration`.
2. Set `Site URL` to `http://localhost:5173`.
3. Add redirect URLs:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
4. Save.

## 5. Local Environment Checklist

Frontend (`/Users/jaydenpiao/Desktop/AI-Closet-Planner/frontend/.env`):

- `VITE_API_BASE_URL=http://localhost:8000`
- `VITE_SUPABASE_URL=https://kkicdnsqwvqjlsrsrvxl.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`

Backend (`/Users/jaydenpiao/Desktop/AI-Closet-Planner/backend/.env`):

- `ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `SUPABASE_URL=https://kkicdnsqwvqjlsrsrvxl.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- If `GEMINI_MOCK_MODE=false`, set `GEMINI_API_KEY`.

## 6. Run Locally

Backend:

```bash
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd /Users/jaydenpiao/Desktop/AI-Closet-Planner/frontend
npm install
npm run dev -- --host localhost --port 5173
```

## 7. Verify

Provider check (must redirect to Google, not 400):

```bash
curl -i "https://kkicdnsqwvqjlsrsrvxl.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2Flocalhost%3A5173"
```

Expected after fix: HTTP `302` or `303` with `location: https://accounts.google.com/...`

Backend health:

```bash
curl -sS http://127.0.0.1:8000/api/health
```

Expected:

```json
{"status":"ok"}
```

Protected API without token:

```bash
curl -i http://127.0.0.1:8000/api/me
```

Expected: `401` with `{ "detail": ... }`.

## Troubleshooting

- `Unsupported provider: provider is not enabled`
  - Google provider is still OFF in Supabase.
- `redirect_uri_mismatch`
  - Callback URI in Google client does not exactly match Supabase callback.
- OAuth succeeds but app does not return to local frontend
  - Supabase `Site URL` / redirect URLs are missing localhost values.
- Google app blocked/unverified
  - Add your account as a Test user in Google OAuth consent screen.

## Security Note

Secrets were shared during setup. Rotate these now:

1. Database password
2. Supabase service role key
3. Supabase secret key
4. Gemini API key

Then update local `.env` files with rotated values.
