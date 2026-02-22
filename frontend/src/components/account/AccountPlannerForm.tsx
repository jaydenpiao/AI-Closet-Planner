import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface AccountPlannerFormProps {
  occasion: string
  itinerary: string
  preferences: string
  busy: boolean
  onChange: (next: { occasion: string; itinerary: string; preferences: string }) => void
  onGenerate: () => Promise<void>
}

export function AccountPlannerForm({
  occasion,
  itinerary,
  preferences,
  busy,
  onChange,
  onGenerate,
}: AccountPlannerFormProps) {
  return (
    <Card>
      <CardHeader className="bg-secondary/45">
        <CardTitle>Plan From My Closet</CardTitle>
        <CardDescription>Generate outfits from your saved closet inventory.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <Input
          placeholder="Occasion"
          value={occasion}
          disabled={busy}
          onChange={(event) =>
            onChange({
              occasion: event.target.value,
              itinerary,
              preferences,
            })
          }
        />
        <Textarea
          placeholder="Itinerary"
          value={itinerary}
          disabled={busy}
          onChange={(event) =>
            onChange({
              occasion,
              itinerary: event.target.value,
              preferences,
            })
          }
        />
        <Input
          placeholder="Preferences (optional)"
          value={preferences}
          disabled={busy}
          onChange={(event) =>
            onChange({
              occasion,
              itinerary,
              preferences: event.target.value,
            })
          }
        />
        <Button
          disabled={busy}
          onClick={() => {
            void onGenerate()
          }}
        >
          {busy ? "Generating..." : "Generate from saved closet"}
        </Button>
      </CardContent>
    </Card>
  )
}
