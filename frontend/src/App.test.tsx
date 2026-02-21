import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import App from "@/App"
import { analyzeCloset, generateOutfits, getHealth } from "@/lib/api"

vi.mock("@/lib/api", () => {
  class MockApiError extends Error {
    status: number

    constructor(message: string, status: number) {
      super(message)
      this.name = "ApiError"
      this.status = status
    }
  }

  return {
    ApiError: MockApiError,
    getHealth: vi.fn(),
    analyzeCloset: vi.fn(),
    generateOutfits: vi.fn(),
  }
})

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getHealth).mockResolvedValue({ status: "ok" })
    vi.mocked(analyzeCloset).mockResolvedValue({
      source: "manual_text",
      summary: "Parsed 1 item.",
      items: [
        {
          id: "item-1",
          name: "White Tee",
          category: "top",
          color: "white",
          material: null,
          pattern: null,
          formality: "casual",
          seasonality: ["spring", "summer"],
          tags: ["test"],
          notes: null,
        },
      ],
      category_counts: {
        top: 1,
        bottom: 0,
        dress: 0,
        outerwear: 0,
        shoes: 0,
        accessory: 0,
        other: 0,
      },
      warnings: [],
    })
    vi.mocked(generateOutfits).mockResolvedValue({
      occasion: "Team dinner",
      itinerary: "Dinner then drinks",
      outfits: [
        {
          outfit_id: "outfit-1",
          title: "Simple Outfit",
          pieces: [
            {
              item_id: "item-1",
              item_name: "White Tee",
              category: "top",
              styling_note: "Keep it simple.",
            },
            {
              item_id: "item-2",
              item_name: "Black Jeans",
              category: "bottom",
              styling_note: "Creates contrast.",
            },
          ],
          reasoning: "Works for casual plans.",
          confidence: 0.84,
          alternatives: [],
        },
        {
          outfit_id: "outfit-2",
          title: "Layered Outfit",
          pieces: [
            {
              item_id: "item-1",
              item_name: "White Tee",
              category: "top",
              styling_note: "Good base layer.",
            },
            {
              item_id: "item-3",
              item_name: "Navy Overshirt",
              category: "outerwear",
              styling_note: "Adds structure.",
            },
          ],
          reasoning: "Adds flexibility for weather changes.",
          confidence: 0.8,
          alternatives: ["Swap overshirt for a blazer."],
        },
      ],
      global_tips: ["Steam the shirt before leaving."],
    })
  })

  it("shows validation errors when submit is missing required inputs", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /Analyze Closet \+ Generate Outfits/i }))

    expect(screen.getByText("Add closet images or manual clothes text before submitting.")).toBeInTheDocument()
    expect(screen.getByText("Occasion is required.")).toBeInTheDocument()
    expect(screen.getByText("Itinerary is required.")).toBeInTheDocument()
    expect(analyzeCloset).not.toHaveBeenCalled()
  })

  it("renders parsed closet and outfit cards from demo data", async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole("button", { name: /Use demo data/i }))

    expect(screen.getByText("Parsed Closet")).toBeInTheDocument()
    expect(screen.getByText("Outfit Suggestions")).toBeInTheDocument()
    expect(screen.getByText("Clean Smart Casual")).toBeInTheDocument()
  })

  it("shows API failure guidance with demo data recommendation", async () => {
    const user = userEvent.setup()
    vi.mocked(analyzeCloset).mockRejectedValueOnce(new Error("network down"))

    render(<App />)

    await user.type(screen.getByLabelText("Manual Clothes List (optional)"), "white tee, black jeans")
    await user.type(screen.getByLabelText("Occasion"), "Team dinner")
    await user.type(screen.getByLabelText("Itinerary"), "Dinner then drinks")
    await user.click(screen.getByRole("button", { name: /Analyze Closet \+ Generate Outfits/i }))

    await waitFor(() => {
      expect(
        screen.getByText(/Backend unavailable or request failed\. Retry or use demo data\./i)
      ).toBeInTheDocument()
    })
  })
})
