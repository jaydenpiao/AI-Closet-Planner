export type ClothingCategory =
  | "top"
  | "bottom"
  | "dress"
  | "outerwear"
  | "shoes"
  | "accessory"
  | "other"

export type Formality = "casual" | "smart-casual" | "formal" | "athleisure" | "unknown"

export type Season = "spring" | "summer" | "fall" | "winter"

export interface ClosetItem {
  id: string
  name: string
  category: ClothingCategory
  color: string
  material?: string | null
  pattern?: string | null
  formality: Formality
  seasonality: Season[]
  tags: string[]
  notes?: string | null
}

export interface AnalyzeClosetResponse {
  source: "images" | "manual_text" | "images+manual_text"
  summary: string
  items: ClosetItem[]
  category_counts: Record<ClothingCategory, number>
  warnings: string[]
}

export interface GenerateOutfitsRequest {
  closet_items: ClosetItem[]
  occasion: string
  itinerary: string
  preferences?: string | null
}

export interface OutfitPiece {
  item_id: string
  item_name: string
  category: ClothingCategory
  styling_note: string
}

export interface OutfitSuggestion {
  outfit_id: string
  title: string
  pieces: OutfitPiece[]
  reasoning: string
  confidence: number
  alternatives: string[]
}

export interface GenerateOutfitsResponse {
  occasion: string
  itinerary: string
  outfits: OutfitSuggestion[]
  global_tips: string[]
}

export interface PlannerFormValues {
  files: File[]
  manualClothesText: string
  occasion: string
  itinerary: string
  preferences: string
}
