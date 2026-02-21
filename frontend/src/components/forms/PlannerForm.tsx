import { Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { PlannerFormValues } from "@/types/api"

interface PlannerFormProps {
  values: PlannerFormValues
  loading: boolean
  onChange: (nextValues: PlannerFormValues) => void
  onSubmit: () => Promise<void>
  onUseDemoData: () => void
}

export function PlannerForm({
  values,
  loading,
  onChange,
  onSubmit,
  onUseDemoData,
}: PlannerFormProps) {
  const fileNames = values.files.map((file) => file.name)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-secondary/45">
        <CardTitle>Plan Inputs</CardTitle>
        <CardDescription>
          At least one of image uploads or manual closet text is required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="files">
            Closet Images (optional, up to 8)
          </label>
          <Input
            id="files"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            disabled={loading}
            onChange={(event) => {
              const selectedFiles = Array.from(event.target.files ?? [])
              onChange({ ...values, files: selectedFiles })
            }}
          />
          {fileNames.length > 0 && (
            <p className="text-xs text-muted-foreground">Selected: {fileNames.join(", ")}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="manual-clothes">
            Manual Clothes List (optional)
          </label>
          <Textarea
            id="manual-clothes"
            placeholder="White oxford shirt, navy chinos, brown loafers"
            value={values.manualClothesText}
            disabled={loading}
            onChange={(event) => onChange({ ...values, manualClothesText: event.target.value })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="occasion">
              Occasion
            </label>
            <Input
              id="occasion"
              placeholder="Team dinner"
              value={values.occasion}
              disabled={loading}
              onChange={(event) => onChange({ ...values, occasion: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="preferences">
              Preferences (optional)
            </label>
            <Input
              id="preferences"
              placeholder="Prefer neutral colors"
              value={values.preferences}
              disabled={loading}
              onChange={(event) => onChange({ ...values, preferences: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="itinerary">
            Itinerary
          </label>
          <Textarea
            id="itinerary"
            placeholder="3pm coworking, 7pm dinner, 9pm drinks"
            value={values.itinerary}
            disabled={loading}
            onChange={(event) => onChange({ ...values, itinerary: event.target.value })}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={loading}
            className="gap-2"
            onClick={() => {
              void onSubmit()
            }}
          >
            <Upload className="h-4 w-4" />
            {loading ? "Planning outfits..." : "Analyze Closet + Generate Outfits"}
          </Button>
          <Button type="button" variant="secondary" disabled={loading} onClick={onUseDemoData}>
            Use demo data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
