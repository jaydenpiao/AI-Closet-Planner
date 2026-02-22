import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { SavedOutfitRecord } from "@/types/api"

interface SavedOutfitsPanelProps {
  items: SavedOutfitRecord[]
  busy: boolean
  onDelete: (savedOutfitId: string) => Promise<void>
}

export function SavedOutfitsPanel({ items, busy, onDelete }: SavedOutfitsPanelProps) {
  return (
    <Card>
      <CardHeader className="bg-secondary/45">
        <CardTitle>Saved Outfits</CardTitle>
        <CardDescription>Outfits you liked and saved for later.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved outfits yet.</p>
        ) : (
          items.map((saved) => {
            const pieces = Array.isArray(saved.outfit_snapshot.pieces)
              ? saved.outfit_snapshot.pieces
              : []

            return (
              <Card key={saved.id}>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{saved.title || saved.outfit_snapshot.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {saved.occasion} • {saved.itinerary}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy}
                      onClick={() => {
                        void onDelete(saved.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>

                  <p className="text-sm">
                    Confidence: {Math.round(saved.outfit_snapshot.confidence * 100)}%
                  </p>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Selected pieces
                    </p>
                    {pieces.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {pieces.map((piece, index) => (
                          <li key={`${saved.id}-${piece.item_id}-${index}`}>
                            <p className="text-sm font-medium capitalize">{piece.item_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {piece.category} - {piece.styling_note}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No clothing item details available.
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{saved.outfit_snapshot.reasoning}</p>
                </CardContent>
              </Card>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
