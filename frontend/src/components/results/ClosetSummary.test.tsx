import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ClosetSummary } from "@/components/results/ClosetSummary"
import { formatClosetBadgeLabel } from "@/lib/closet-summary"
import type { AnalyzeClosetResponse } from "@/types/api"

const baseResult: AnalyzeClosetResponse = {
  source: "manual_text",
  summary: "Parsed test items.",
  items: [],
  category_counts: {
    top: 0,
    bottom: 0,
    dress: 0,
    outerwear: 0,
    shoes: 0,
    accessory: 0,
    other: 0,
  },
  warnings: [],
}

describe("formatClosetBadgeLabel", () => {
  it("returns name when color already appears in the item name", () => {
    expect(formatClosetBadgeLabel("Black Dress", "black")).toBe("Black Dress")
    expect(formatClosetBadgeLabel("Off White Blouse", "off white")).toBe("Off White Blouse")
  })

  it("appends color when it is not present in the item name", () => {
    expect(formatClosetBadgeLabel("Oxford Shirt", "white")).toBe("Oxford Shirt (white)")
  })

  it("returns name for blank or null color", () => {
    expect(formatClosetBadgeLabel("Leather Jacket", "")).toBe("Leather Jacket")
    expect(formatClosetBadgeLabel("Leather Jacket", null)).toBe("Leather Jacket")
  })
})

describe("ClosetSummary", () => {
  it("renders deduplicated color labels in parsed closet badges", () => {
    render(
      <ClosetSummary
        result={{
          ...baseResult,
          items: [
            {
              id: "item-1",
              name: "Black Dress",
              category: "dress",
              color: "black",
              formality: "smart-casual",
              seasonality: ["fall"],
              tags: [],
            },
            {
              id: "item-2",
              name: "Oxford Shirt",
              category: "top",
              color: "white",
              formality: "smart-casual",
              seasonality: ["spring"],
              tags: [],
            },
          ],
          category_counts: {
            ...baseResult.category_counts,
            top: 1,
            dress: 1,
          },
        }}
      />
    )

    expect(screen.getByText("Black Dress")).toBeInTheDocument()
    expect(screen.getByText("Oxford Shirt (white)")).toBeInTheDocument()
    expect(screen.queryByText("Black Dress (black)")).not.toBeInTheDocument()
  })
})
