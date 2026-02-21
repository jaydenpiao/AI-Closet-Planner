import type { AnalyzeClosetResponse, ClothingCategory } from "@/types/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatClosetBadgeLabel } from "@/lib/closet-summary"

interface ClosetSummaryProps {
  result: AnalyzeClosetResponse
}

const CATEGORY_ORDER: ClothingCategory[] = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "accessory",
  "other",
]

export function ClosetSummary({ result }: ClosetSummaryProps) {
  if (result.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Closet Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            No closet items were returned. Try adding more details or use demo data.
          </p>
        </CardHeader>
      </Card>
    )
  }

  const grouped = result.items.reduce<Record<string, AnalyzeClosetResponse["items"]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Closet Summary</CardTitle>
        <p className="text-sm text-muted-foreground">{result.summary}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_ORDER.map((category) => (
            <div key={category} className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </p>
              <p className="mt-1 text-lg font-bold">{result.category_counts[category] ?? 0}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {CATEGORY_ORDER.map((category) => {
            const items = grouped[category] ?? []
            if (items.length === 0) {
              return null
            }

            return (
              <div key={category}>
                <p className="mb-2 text-sm font-semibold capitalize">{category}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <Badge key={item.id} variant="outline" className="bg-card text-xs capitalize">
                      {formatClosetBadgeLabel(item.name, item.color)}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {result.warnings.length > 0 && (
          <div className="rounded-lg border border-primary/30 bg-secondary/55 p-3 text-sm text-foreground">
            <p className="font-semibold text-primary">Warnings</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
