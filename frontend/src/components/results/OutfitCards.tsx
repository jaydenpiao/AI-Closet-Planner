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
          <CardTitle>Outfit Suggestions</CardTitle>
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
        <h2 className="text-xl font-semibold">Outfit Suggestions</h2>
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
              <CardTitle className="text-lg">{outfit.title}</CardTitle>
              <StarRating confidence={outfit.confidence} />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="notepad-section">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Selected pieces
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
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reasoning
                </p>
                <p className="mt-1 text-sm">{outfit.reasoning}</p>
              </div>

              {outfit.alternatives.length > 0 && (
                <div className="notepad-section">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Alternatives
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
            <CardTitle className="text-base">Global Tips</CardTitle>
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
