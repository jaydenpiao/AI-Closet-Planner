import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GenerateOutfitsResponse } from "@/types/api"

interface OutfitCardsProps {
  result: GenerateOutfitsResponse
}

export function OutfitCards({ result }: OutfitCardsProps) {
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
          <Card key={outfit.outfit_id} className="transition-transform duration-200 hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-lg">{outfit.title}</CardTitle>
              <Badge variant="secondary">Confidence {Math.round(outfit.confidence * 100)}%</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
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

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reasoning
                </p>
                <p className="mt-1 text-sm">{outfit.reasoning}</p>
              </div>

              {outfit.alternatives.length > 0 && (
                <div>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Global Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
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
