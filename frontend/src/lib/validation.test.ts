import { describe, expect, it } from "vitest"

import { hasPlannerFormErrors, validatePlannerForm } from "@/lib/validation"
import type { PlannerFormValues } from "@/types/api"

const baseValues: PlannerFormValues = {
  files: [],
  manualClothesText: "white tee",
  occasion: "Team dinner",
  itinerary: "Dinner then drinks",
  preferences: "",
}

describe("validatePlannerForm", () => {
  it("rejects more than max file count", () => {
    const files = Array.from({ length: 9 }, (_, index) => new File(["x"], `item-${index}.jpg`, { type: "image/jpeg" }))

    const errors = validatePlannerForm({ ...baseValues, files })

    expect(errors.files).toContain("Upload up to 8 images.")
    expect(hasPlannerFormErrors(errors)).toBe(true)
  })

  it("rejects unsupported file types", () => {
    const files = [new File(["x"], "closet.gif", { type: "image/gif" })]

    const errors = validatePlannerForm({ ...baseValues, files })

    expect(errors.files).toContain("Unsupported file type")
    expect(hasPlannerFormErrors(errors)).toBe(true)
  })
})
