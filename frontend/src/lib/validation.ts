import type { PlannerFormErrors, PlannerFormValues } from "@/types/api"

export const MAX_UPLOAD_FILES = 8
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

export function validatePlannerForm(values: PlannerFormValues): PlannerFormErrors {
  const errors: PlannerFormErrors = {}
  const manualText = values.manualClothesText.trim()
  const allowedFileTypes: readonly string[] = ALLOWED_FILE_TYPES

  if (!manualText && values.files.length === 0) {
    errors.form = "Add closet images or manual clothes text before submitting."
  }

  if (values.files.length > MAX_UPLOAD_FILES) {
    errors.files = `Upload up to ${MAX_UPLOAD_FILES} images.`
  }

  const invalidFile = values.files.find((file) => !allowedFileTypes.includes(file.type))
  if (invalidFile) {
    errors.files = `Unsupported file type for ${invalidFile.name}. Use JPG, PNG, or WEBP.`
  }

  if (!values.occasion.trim()) {
    errors.occasion = "Occasion is required."
  }

  if (!values.itinerary.trim()) {
    errors.itinerary = "Itinerary is required."
  }

  return errors
}

export function hasPlannerFormErrors(errors: PlannerFormErrors): boolean {
  return Object.values(errors).some(Boolean)
}
