import type {
  AnalyzeClosetResponse,
  GenerateOutfitsRequest,
  GenerateOutfitsResponse,
  PlannerFormValues,
} from "@/types/api"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string }
    if (data.detail) {
      return data.detail
    }
  } catch {
    return `Request failed with status ${response.status}`
  }

  return `Request failed with status ${response.status}`
}

export async function getHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/api/health`)
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  return (await response.json()) as { status: string }
}

export async function analyzeCloset(values: PlannerFormValues): Promise<AnalyzeClosetResponse> {
  const formData = new FormData()

  values.files.forEach((file) => {
    formData.append("files[]", file)
  })

  const manualText = values.manualClothesText.trim()
  if (manualText) {
    formData.append("manual_clothes_text", manualText)
  }

  const response = await fetch(`${API_BASE_URL}/api/analyze-closet`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }

  return (await response.json()) as AnalyzeClosetResponse
}

export async function generateOutfits(
  payload: GenerateOutfitsRequest
): Promise<GenerateOutfitsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate-outfits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }

  return (await response.json()) as GenerateOutfitsResponse
}
