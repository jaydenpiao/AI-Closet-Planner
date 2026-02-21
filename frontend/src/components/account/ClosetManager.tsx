import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ClosetItemCreate, ClosetItemRecord, ClosetItemUpdate, ClothingCategory, Formality } from "@/types/api"

interface ClosetManagerProps {
  items: ClosetItemRecord[]
  busy: boolean
  onCreate: (payload: ClosetItemCreate) => Promise<void>
  onUpdate: (itemId: string, payload: ClosetItemUpdate) => Promise<void>
  onDelete: (itemId: string) => Promise<void>
  onUploadImage: (itemId: string, file: File) => Promise<void>
  onDeleteImage: (itemId: string) => Promise<void>
}

const categories: ClothingCategory[] = ["top", "bottom", "dress", "outerwear", "shoes", "accessory", "other"]
const formalities: Formality[] = ["casual", "smart-casual", "formal", "athleisure", "unknown"]
const seasons = ["spring", "summer", "fall", "winter"] as const

type FormState = {
  name: string
  category: ClothingCategory
  color: string
  material: string
  pattern: string
  formality: Formality
  seasonalityCsv: string
  tagsCsv: string
  notes: string
}

const initialFormState: FormState = {
  name: "",
  category: "top",
  color: "",
  material: "",
  pattern: "",
  formality: "casual",
  seasonalityCsv: "spring,summer",
  tagsCsv: "",
  notes: "",
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function ClosetManager({
  items,
  busy,
  onCreate,
  onUpdate,
  onDelete,
  onUploadImage,
  onDeleteImage,
}: ClosetManagerProps) {
  const [form, setForm] = useState<FormState>(initialFormState)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imageFiles, setImageFiles] = useState<Record<string, File | undefined>>({})

  const seasonSet = useMemo(() => new Set(seasons), [])

  async function submitCreateOrUpdate() {
    const seasonality = parseCsv(form.seasonalityCsv).filter((value): value is (typeof seasons)[number] =>
      seasonSet.has(value as (typeof seasons)[number])
    )
    const payloadBase = {
      name: form.name.trim(),
      category: form.category,
      color: form.color.trim(),
      material: form.material.trim() || null,
      pattern: form.pattern.trim() || null,
      formality: form.formality,
      seasonality,
      tags: parseCsv(form.tagsCsv),
      notes: form.notes.trim() || null,
    }

    if (editingId) {
      await onUpdate(editingId, payloadBase)
    } else {
      await onCreate(payloadBase)
    }
    setEditingId(null)
    setForm(initialFormState)
  }

  return (
    <Card>
      <CardHeader className="bg-secondary/45">
        <CardTitle>My Closet</CardTitle>
        <CardDescription>Add, edit, delete, and upload a primary photo per clothing item.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Name (e.g., White Oxford Shirt)"
            value={form.name}
            disabled={busy}
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
          />
          <Input
            placeholder="Color"
            value={form.color}
            disabled={busy}
            onChange={(event) => setForm((previous) => ({ ...previous, color: event.target.value }))}
          />
          <label className="text-sm text-muted-foreground">
            Category
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.category}
              disabled={busy}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, category: event.target.value as ClothingCategory }))
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted-foreground">
            Formality
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.formality}
              disabled={busy}
              onChange={(event) => setForm((previous) => ({ ...previous, formality: event.target.value as Formality }))}
            >
              {formalities.map((formality) => (
                <option key={formality} value={formality}>
                  {formality}
                </option>
              ))}
            </select>
          </label>
          <Input
            placeholder="Material (optional)"
            value={form.material}
            disabled={busy}
            onChange={(event) => setForm((previous) => ({ ...previous, material: event.target.value }))}
          />
          <Input
            placeholder="Pattern (optional)"
            value={form.pattern}
            disabled={busy}
            onChange={(event) => setForm((previous) => ({ ...previous, pattern: event.target.value }))}
          />
          <Input
            placeholder="Seasonality CSV (spring,summer,fall,winter)"
            value={form.seasonalityCsv}
            disabled={busy}
            onChange={(event) => setForm((previous) => ({ ...previous, seasonalityCsv: event.target.value }))}
          />
          <Input
            placeholder="Tags CSV (optional)"
            value={form.tagsCsv}
            disabled={busy}
            onChange={(event) => setForm((previous) => ({ ...previous, tagsCsv: event.target.value }))}
          />
        </div>
        <Textarea
          placeholder="Notes (optional)"
          value={form.notes}
          disabled={busy}
          onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))}
        />
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={busy}
            onClick={() => {
              void submitCreateOrUpdate()
            }}
          >
            {editingId ? "Update item" : "Add item"}
          </Button>
          {editingId && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setEditingId(null)
                setForm(initialFormState)
              }}
            >
              Cancel edit
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved closet items yet.</p>
          ) : (
            items.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {item.name} ({item.color})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.category} • {item.formality} • {item.seasonality.join(", ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setEditingId(item.id)
                          setForm({
                            name: item.name,
                            category: item.category,
                            color: item.color,
                            material: item.material ?? "",
                            pattern: item.pattern ?? "",
                            formality: item.formality,
                            seasonalityCsv: item.seasonality.join(","),
                            tagsCsv: item.tags.join(","),
                            notes: item.notes ?? "",
                          })
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() => {
                          void onDelete(item.id)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-28 w-28 rounded-md object-cover"
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={busy}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        setImageFiles((previous) => ({ ...previous, [item.id]: file }))
                      }}
                    />
                    <Button
                      size="sm"
                      disabled={busy || !imageFiles[item.id]}
                      onClick={() => {
                        const selected = imageFiles[item.id]
                        if (selected) {
                          void onUploadImage(item.id, selected)
                        }
                      }}
                    >
                      Upload image
                    </Button>
                    {item.image_path && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          void onDeleteImage(item.id)
                        }}
                      >
                        Remove image
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
