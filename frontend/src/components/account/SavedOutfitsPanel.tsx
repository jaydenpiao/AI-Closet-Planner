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
          items.map((saved) => (
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
                <p className="text-sm text-muted-foreground">{saved.outfit_snapshot.reasoning}</p>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  )
}
