# API Contract - Closet Planner AI MVP

Base URL: `http://127.0.0.1:8000`  
Prefix: `/api`

## Contract Stability

This MVP keeps the following contract stable for frontend integration:

- Endpoints: `/api/health`, `/api/analyze-closet`, `/api/generate-outfits`
- Analyze multipart keys: `files[]`, `manual_clothes_text`
- Generate JSON key: `closet_items`
- Error body shape: `{ "detail": "<message>" }`

No endpoint renames or response key removals are expected in this sprint.

## GET `/api/health`

### Response `200`

```json
{ "status": "ok" }
```

## POST `/api/analyze-closet`

Content-Type: `multipart/form-data`

### Inputs

- `files[]` (optional, repeatable): image files
- `manual_clothes_text` (optional): string

At least one of `files[]` or `manual_clothes_text` is required.

### Validation

- Allowed MIME: `image/jpeg`, `image/png`, `image/webp`
- Max file size: `8MB` each (`MAX_UPLOAD_MB`)
- Max file count: `8` (`MAX_UPLOAD_FILES`)
- Empty files are rejected

### Response `200` (`AnalyzeClosetResponse`)

```json
{
  "source": "manual_text",
  "summary": "Parsed 3 clothing items and grouped them for outfit planning.",
  "items": [
    {
      "id": "manual-1",
      "name": "white tee",
      "category": "top",
      "color": "white",
      "material": null,
      "pattern": null,
      "formality": "smart-casual",
      "seasonality": ["spring", "fall"],
      "tags": ["manual-input", "mvp"],
      "notes": null
    }
  ],
  "category_counts": {
    "top": 1,
    "bottom": 0,
    "dress": 0,
    "outerwear": 0,
    "shoes": 0,
    "accessory": 0,
    "other": 0
  },
  "warnings": []
}
```

Notes:

- `source` is one of: `images`, `manual_text`, `images+manual_text`
- `category_counts` includes all `ClothingCategory` enum keys

## POST `/api/generate-outfits`

Content-Type: `application/json`

### Request (`GenerateOutfitsRequest`)

```json
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
    }
  ],
  "occasion": "Business casual meetup",
  "itinerary": "Coworking then dinner",
  "preferences": "Prefer neutral colors"
}
```

### Response `200` (`GenerateOutfitsResponse`)

Hard guarantees:

- `outfits` length is always `2..4`
- each outfit has `pieces` length `>= 2`
- `confidence` is always between `0` and `1`

```json
{
  "occasion": "Business casual meetup",
  "itinerary": "Coworking then dinner",
  "outfits": [
    {
      "outfit_id": "outfit-1",
      "title": "Smart Daytime Core",
      "pieces": [
        {
          "item_id": "manual-1",
          "item_name": "white tee",
          "category": "top",
          "styling_note": "Use as the visual anchor."
        },
        {
          "item_id": "manual-2",
          "item_name": "blue jeans",
          "category": "bottom",
          "styling_note": "Keeps the look balanced and easy to move in."
        }
      ],
      "reasoning": "Built for a polished but comfortable day plan.",
      "confidence": 0.86,
      "alternatives": ["Swap shoes for a cleaner pair."]
    },
    {
      "outfit_id": "outfit-2",
      "title": "Layered Versatile Option",
      "pieces": [
        {
          "item_id": "manual-1",
          "item_name": "white tee",
          "category": "top",
          "styling_note": "Base layer that works across activities."
        },
        {
          "item_id": "manual-3",
          "item_name": "brown loafers",
          "category": "shoes",
          "styling_note": "Reliable for longer wear."
        }
      ],
      "reasoning": "Adapts well to schedule changes in the itinerary.",
      "confidence": 0.82,
      "alternatives": ["Add a light layer if the evening cools down."]
    }
  ],
  "global_tips": ["Steam or lint-roll pieces before leaving."]
}
```

## Error Codes

All non-2xx responses follow:

```json
{ "detail": "Human-readable message" }
```

- `400`: missing required analyze input or too many files
- `413`: uploaded file too large
- `415`: unsupported file type
- `422`: request validation error
- `502`: Gemini unavailable or Gemini response could not be validated after retry

## CORS

Allowed origins are configured via `ALLOWED_ORIGINS` (comma-separated).
Default: `http://localhost:5173`

## Schema Enums

- `ClothingCategory`: `top | bottom | dress | outerwear | shoes | accessory | other`
- `Formality`: `casual | smart-casual | formal | athleisure | unknown`
- `Season`: `spring | summer | fall | winter`
