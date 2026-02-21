import { useRef } from "react"
import {
  CalendarDays,
  ClipboardList,
  Heart,
  ImageUp,
  MapPinned,
  NotebookPen,
  Upload,
  WandSparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ALLOWED_FILE_TYPES, MAX_UPLOAD_FILES } from "@/lib/validation"
import type { PlannerFormErrors, PlannerFormValues } from "@/types/api"

interface PlannerFormProps {
  values: PlannerFormValues
  errors: PlannerFormErrors
  loading: boolean
  onChange: (nextValues: PlannerFormValues) => void
  onClearFiles: () => void
  onSubmit: () => Promise<void>
  onUseDemoData: () => void
}

export function PlannerForm({
  values,
  errors,
  loading,
  onChange,
  onClearFiles,
  onSubmit,
  onUseDemoData,
}: PlannerFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const fileNames = values.files.map((file) => file.name)
  const uploadError = errors.files ?? errors.manualClothesText ?? errors.form

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-secondary/45">
        <CardTitle>
          <span className="kawaii-heading">
            <NotebookPen aria-hidden="true" className="kawaii-heading-icon" />
            <span>Plan Inputs</span>
          </span>
        </CardTitle>
        <CardDescription>
          At least one of image uploads or manual closet text is required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="files">
            <span className="kawaii-label">
              <ImageUp aria-hidden="true" className="kawaii-label-icon" />
              <span>Closet Images (optional, up to 8)</span>
            </span>
          </label>
          <Input
            id="files"
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            disabled={loading}
            aria-invalid={Boolean(uploadError)}
            onChange={(event) => {
              const selectedFiles = Array.from(event.target.files ?? [])
              onChange({ ...values, files: selectedFiles })
            }}
          />
          <p className="text-xs text-muted-foreground">
            Allowed: {ALLOWED_FILE_TYPES.map((fileType) => fileType.replace("image/", "")).join(", ").toUpperCase()} | Max {MAX_UPLOAD_FILES} images
          </p>
          {fileNames.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Selected: {fileNames.join(", ")}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                  }
                  onClearFiles()
                }}
              >
                Clear files
              </Button>
            </div>
          ) : null}
          {uploadError && <p className="text-xs font-medium text-destructive">{uploadError}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="manual-clothes">
            <span className="kawaii-label">
              <ClipboardList aria-hidden="true" className="kawaii-label-icon" />
              <span>Manual Clothes List (optional)</span>
            </span>
          </label>
          <Textarea
            id="manual-clothes"
            placeholder="White oxford shirt, navy chinos, brown loafers"
            value={values.manualClothesText}
            disabled={loading}
            aria-invalid={Boolean(errors.manualClothesText ?? errors.form)}
            onChange={(event) => onChange({ ...values, manualClothesText: event.target.value })}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="occasion">
              <span className="kawaii-label">
                <CalendarDays aria-hidden="true" className="kawaii-label-icon" />
                <span>Occasion</span>
              </span>
            </label>
            <Input
              id="occasion"
              placeholder="Team dinner"
              value={values.occasion}
              disabled={loading}
              aria-invalid={Boolean(errors.occasion)}
              onChange={(event) => onChange({ ...values, occasion: event.target.value })}
            />
            {errors.occasion && <p className="text-xs font-medium text-destructive">{errors.occasion}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="preferences">
              <span className="kawaii-label">
                <Heart aria-hidden="true" className="kawaii-label-icon kawaii-heading-icon-soft" />
                <span>Preferences (optional)</span>
              </span>
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
            <span className="kawaii-label">
              <MapPinned aria-hidden="true" className="kawaii-label-icon" />
              <span>Itinerary</span>
            </span>
          </label>
          <Textarea
            id="itinerary"
            placeholder="3pm coworking, 7pm dinner, 9pm drinks"
            value={values.itinerary}
            disabled={loading}
            aria-invalid={Boolean(errors.itinerary)}
            onChange={(event) => onChange({ ...values, itinerary: event.target.value })}
          />
          {errors.itinerary && <p className="text-xs font-medium text-destructive">{errors.itinerary}</p>}
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
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            className="gap-2"
            onClick={onUseDemoData}
          >
            <WandSparkles aria-hidden="true" className="h-4 w-4" />
            Use demo data
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
