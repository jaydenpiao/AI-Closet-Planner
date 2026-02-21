import { Star, StarHalf } from "lucide-react"

import { cn } from "@/lib/utils"

interface StarRatingProps {
  confidence: number
  maxStars?: number
  className?: string
}

export function StarRating({ confidence, maxStars = 5, className }: StarRatingProps) {
  function formatStars(value: number): string {
    if (Number.isInteger(value)) {
      return String(value)
    }

    return value.toFixed(1)
  }

  const safeMaxStars = Math.max(1, Math.floor(maxStars))
  const normalized = Math.min(1, Math.max(0, confidence))
  const rawStars = normalized * safeMaxStars
  const roundedStars = Math.round(rawStars * 2) / 2
  const fullStars = Math.floor(roundedStars)
  const hasHalfStar = roundedStars - fullStars === 0.5
  const emptyStars = safeMaxStars - fullStars - (hasHalfStar ? 1 : 0)
  const formattedStars = formatStars(roundedStars)
  const ratingLabel = `${formattedStars}/${safeMaxStars}`

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      aria-label={`Rating ${formattedStars} out of ${safeMaxStars}`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: fullStars }).map((_, index) => (
          <Star
            key={`full-${index}`}
            className="h-4 w-4 fill-yellow-400 text-yellow-400"
            aria-hidden="true"
            data-testid="star-full"
          />
        ))}

        {hasHalfStar && (
          <StarHalf
            className="h-4 w-4 fill-yellow-400 text-yellow-400"
            aria-hidden="true"
            data-testid="star-half"
          />
        )}

        {Array.from({ length: emptyStars }).map((_, index) => (
          <Star
            key={`empty-${index}`}
            className="h-4 w-4 text-yellow-200"
            aria-hidden="true"
            data-testid="star-empty"
          />
        ))}
      </div>

      <span className="text-sm font-semibold text-foreground">{ratingLabel}</span>
    </div>
  )
}
