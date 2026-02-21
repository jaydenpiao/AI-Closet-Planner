# API Contract - Closet Planner AI MVP

Base URL: `http://127.0.0.1:8000`
Prefix: `/api`

## Endpoints

## GET `/api/health`

### Response `200`

```json
{ "status": "ok" }
```

## POST `/api/analyze-closet`

`multipart/form-data`

### Inputs

- `files[]` (optional, repeatable): image files
- `manual_clothes_text` (optional): string

At least one of `files[]` or `manual_clothes_text` is required.

### Validation

- Allowed MIME: `image/jpeg`, `image/png`, `image/webp`
- Max file size: `8MB` each
- Max file count: `8`

### Response `200` (`AnalyzeClosetResponse`)

```json
{
  "source": "manual_text",
  "summary": "Parsed 4 clothing items and grouped them for outfit planning.",
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

## POST `/api/generate-outfits`

`application/json`

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

- `outfits` length is always `2..4`
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
          "styling_note": "Keeps the look grounded and wearable all day."
        }
      ],
      "reasoning": "Built for a polished but comfortable day plan.",
      "confidence": 0.86,
      "alternatives": ["Swap shoes for a cleaner pair."]
    },
    {
      "outfit_id": "outfit-2",
      "title": "Layered Evening Option",
      "pieces": [
        {
          "item_id": "manual-1",
          "item_name": "white tee",
          "category": "top",
          "styling_note": "Works as a clean base under outerwear."
        },
        {
          "item_id": "manual-3",
          "item_name": "brown loafers",
          "category": "shoes",
          "styling_note": "Adds dressier finish for evening plans."
        }
      ],
      "reasoning": "Adds flexibility for temperature and venue changes.",
      "confidence": 0.82,
      "alternatives": ["Drop outerwear if the evening remains warm."]
    }
  ],
  "global_tips": ["Steam or lint-roll pieces before leaving."]
}
```

## Error Codes

- `400`: missing required inputs or too many files
- `413`: file too large
- `415`: unsupported file type
- `422`: request schema validation error
- `502`: Gemini response not valid JSON after retry or Gemini service failure

## Schema Enums

- `ClothingCategory`: `top | bottom | dress | outerwear | shoes | accessory | other`
- `Formality`: `casual | smart-casual | formal | athleisure | unknown`
- `Season`: `spring | summer | fall | winter`
