# API Contract - Closet Planner AI (v2)

Base URL: `http://127.0.0.1:8000`  
Prefix: `/api`

## Stability Rules

The guest MVP contract remains unchanged:

1. `GET /api/health`
2. `POST /api/analyze-closet`
3. `POST /api/generate-outfits`

New authenticated capabilities are additive under `/api/me/*`.

## Auth Header (Protected Routes)

Protected endpoints require:

```http
Authorization: Bearer <supabase_access_token>
```

Error shape is stable:

```json
{ "detail": "Human-readable message" }
```

## Guest Endpoints (Unchanged)

### GET `/api/health`

Response `200`:

```json
{ "status": "ok" }
```

### POST `/api/analyze-closet`

`multipart/form-data`

Inputs:

- `files[]` (optional, repeatable)
- `manual_clothes_text` (optional)

At least one input is required.

Validation:

- MIME: `image/jpeg`, `image/png`, `image/webp`
- max file size: `MAX_UPLOAD_MB` (default `8MB`) per file
- max file count: `MAX_UPLOAD_FILES` (default `8`)

Response `200`: `AnalyzeClosetResponse`

### POST `/api/generate-outfits`

`application/json` body:

```json
{
  "closet_items": [],
  "occasion": "Business casual meetup",
  "itinerary": "Coworking then dinner",
  "preferences": "Prefer neutral colors"
}
```

Response `200`: `GenerateOutfitsResponse`

Guarantees:

- outfits length is `2..4`
- each outfit has at least 2 pieces
- confidence is `0..1`

## Protected Endpoints (New)

### GET `/api/me`

Response `200`:

```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "display_name": "Optional Name"
}
```

### Closet Items

### GET `/api/me/closet-items`

Response `200`: `ClosetItemRecord[]`

### POST `/api/me/closet-items`

Body: `ClosetItemCreate`

Response `200`: `ClosetItemRecord`

### PATCH `/api/me/closet-items/{item_id}`

Body: `ClosetItemUpdate` (partial)

Response `200`: `ClosetItemRecord`

### DELETE `/api/me/closet-items/{item_id}`

Response `200`:

```json
{ "deleted": true }
```

### POST `/api/me/closet-items/{item_id}/image`

`multipart/form-data` with field:

- `file` (single image)

Response `200`: updated `ClosetItemRecord` with signed `image_url`.

### DELETE `/api/me/closet-items/{item_id}/image`

Response `200`: updated `ClosetItemRecord` with image fields cleared.

### Saved Outfits

### GET `/api/me/saved-outfits`

Response `200`: `SavedOutfitRecord[]`

### POST `/api/me/saved-outfits`

Body:

```json
{
  "title": "Monday Night Bar Date",
  "occasion": "trip to mexico",
  "itinerary": "monday night: going on a bar date",
  "outfit_snapshot": {
    "outfit_id": "outfit-1",
    "title": "Monday Night Bar Date",
    "pieces": [],
    "reasoning": "why this works",
    "confidence": 0.9,
    "alternatives": []
  },
  "global_tips": ["tip 1"]
}
```

Response `200`: `SavedOutfitRecord`

### DELETE `/api/me/saved-outfits/{saved_outfit_id}`

Response `200`:

```json
{ "deleted": true }
```

### Generate from Saved Closet

### POST `/api/me/generate-outfits`

Body:

```json
{
  "occasion": "Date night",
  "itinerary": "7pm dinner, 9pm drinks",
  "preferences": "neutral colors"
}
```

Behavior:

1. Backend loads caller’s persisted closet items.
2. Backend calls Gemini generation using existing structured schema.

Response `200`: `GenerateOutfitsResponse`

## Core New Models

### ClosetItemCreate

```json
{
  "name": "White Oxford Shirt",
  "category": "top",
  "color": "white",
  "material": "cotton",
  "pattern": null,
  "formality": "smart-casual",
  "seasonality": ["spring", "fall"],
  "tags": ["essential"],
  "notes": null
}
```

### ClosetItemRecord

`ClosetItemCreate` fields plus:

- `id`, `user_id`
- `image_path`, `image_mime_type`, `image_url`
- `created_at`, `updated_at`

### SavedOutfitRecord

- `id`, `user_id`
- `title`, `occasion`, `itinerary`
- `outfit_snapshot` (`OutfitSuggestion`)
- `global_tips`
- `created_at`

## Error Codes

- `400`: request constraints violated (e.g., missing input, empty update payload)
- `401`: missing/invalid bearer token for protected routes
- `404`: resource not found for current user
- `413`: file too large
- `415`: unsupported file type
- `422`: schema validation error
- `502`: upstream Gemini or Supabase integration failure
