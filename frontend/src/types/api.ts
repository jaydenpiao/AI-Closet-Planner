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

export interface MeResponse {
  user_id: string
  email?: string | null
  display_name?: string | null
}

export interface ClosetItemCreate {
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

export interface ClosetItemUpdate {
  name?: string
  category?: ClothingCategory
  color?: string
  material?: string | null
  pattern?: string | null
  formality?: Formality
  seasonality?: Season[]
  tags?: string[]
  notes?: string | null
}

export interface ClosetItemRecord extends ClosetItem {
  user_id: string
  image_path?: string | null
  image_mime_type?: string | null
  image_url?: string | null
  created_at: string
  updated_at: string
}

export interface SavedOutfitCreate {
  title?: string | null
  occasion: string
  itinerary: string
  outfit_snapshot: OutfitSuggestion
  global_tips: string[]
}

export interface SavedOutfitRecord {
  id: string
  user_id: string
  title?: string | null
  occasion: string
  itinerary: string
  outfit_snapshot: OutfitSuggestion
  global_tips: string[]
  created_at: string
}

export interface ProtectedGenerateOutfitsRequest {
  occasion: string
  itinerary: string
  preferences?: string | null
}

export interface PlannerFormValues {
  files: File[]
  manualClothesText: string
  occasion: string
  itinerary: string
  preferences: string
}

export interface PlannerFormErrors {
  files?: string
  manualClothesText?: string
  occasion?: string
  itinerary?: string
  form?: string
}
