import { ClipboardList, Flower2, NotebookPen, Shirt, Sparkles, WandSparkles } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import type { GenerateOutfitsResponse } from "@/types/api"

interface OutfitCardsProps {
  result: GenerateOutfitsResponse
}

export function OutfitCards({ result }: OutfitCardsProps) {
  if (result.outfits.length === 0) {
    return (
      <Card className="notepad-card">
        <CardHeader>
          <CardTitle>
            <span className="kawaii-heading">
              <Sparkles aria-hidden="true" className="kawaii-heading-icon kawaii-sparkle" />
              <span>Outfit Suggestions</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No outfit suggestions were returned. Retry or use demo data.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          <span className="kawaii-heading">
            <Sparkles aria-hidden="true" className="kawaii-heading-icon kawaii-sparkle" />
            <span>Outfit Suggestions</span>
            <Flower2 aria-hidden="true" className="kawaii-heading-icon kawaii-heading-icon-soft" />
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Occasion: {result.occasion} | Itinerary: {result.itinerary}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {result.outfits.map((outfit) => (
          <Card
            key={outfit.outfit_id}
            className="notepad-card transition-transform duration-200 hover:-translate-y-0.5"
          >
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-lg">
                <span className="kawaii-heading">
                  <Shirt aria-hidden="true" className="kawaii-heading-icon" />
                  <span>{outfit.title}</span>
                </span>
              </CardTitle>
              <StarRating confidence={outfit.confidence} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="notepad-section">
                <p className="kawaii-section-label text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ClipboardList aria-hidden="true" className="kawaii-section-icon" />
                  <span>Selected pieces</span>
                </p>
                <ul className="mt-2 space-y-2">
                  {outfit.pieces.map((piece) => (
                    <li key={`${outfit.outfit_id}-${piece.item_id}-${piece.styling_note}`}>
                      <p className="text-sm font-medium capitalize">{piece.item_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {piece.category} - {piece.styling_note}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="notepad-section">
                <p className="kawaii-section-label text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <NotebookPen aria-hidden="true" className="kawaii-section-icon" />
                  <span>Reasoning</span>
                </p>
                <p className="mt-1 text-sm">{outfit.reasoning}</p>
              </div>

              {outfit.alternatives.length > 0 && (
                <div className="notepad-section">
                  <p className="kawaii-section-label text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <WandSparkles aria-hidden="true" className="kawaii-section-icon" />
                    <span>Alternatives</span>
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                    {outfit.alternatives.map((alternative) => (
                      <li key={alternative}>{alternative}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {result.global_tips.length > 0 && (
        <Card className="notepad-card">
          <CardHeader>
            <CardTitle className="text-base">
              <span className="kawaii-heading">
                <Flower2 aria-hidden="true" className="kawaii-heading-icon kawaii-heading-icon-soft" />
                <span>Global Tips</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="notepad-section list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {result.global_tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
