import type {
  AnalyzeClosetResponse,
  ClosetItemCreate,
  ClosetItemRecord,
  ClosetItemUpdate,
  GenerateOutfitsRequest,
  GenerateOutfitsResponse,
  MeResponse,
  PlannerFormValues,
  ProtectedGenerateOutfitsRequest,
  SavedOutfitCreate,
  SavedOutfitRecord,
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

function buildAuthHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  }
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

export async function getMe(accessToken: string): Promise<MeResponse> {
  const response = await fetch(`${API_BASE_URL}/api/me`, {
    headers: buildAuthHeaders(accessToken),
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  return (await response.json()) as MeResponse
}

export async function listClosetItems(accessToken: string): Promise<ClosetItemRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/me/closet-items`, {
    headers: buildAuthHeaders(accessToken),
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  return (await response.json()) as ClosetItemRecord[]
}

export async function createClosetItem(
  accessToken: string,
  payload: ClosetItemCreate
): Promise<ClosetItemRecord> {
  const response = await fetch(`${API_BASE_URL}/api/me/closet-items`, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  return (await response.json()) as ClosetItemRecord
}

export async function updateClosetItem(
  accessToken: string,
  itemId: string,
  payload: ClosetItemUpdate
): Promise<ClosetItemRecord> {
  const response = await fetch(`${API_BASE_URL}/api/me/closet-items/${itemId}`, {
    method: "PATCH",
    headers: {
      ...buildAuthHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  return (await response.json()) as ClosetItemRecord
}

export async function deleteClosetItem(accessToken: string, itemId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/me/closet-items/${itemId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(accessToken),
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
}

export async function uploadClosetItemImage(
  accessToken: string,
  itemId: string,
  file: File
): Promise<ClosetItemRecord> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/api/me/closet-items/${itemId}/image`, {
    method: "POST",
    headers: buildAuthHeaders(accessToken),
    body: formData,
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  return (await response.json()) as ClosetItemRecord
}

export async function deleteClosetItemImage(
  accessToken: string,
  itemId: string
): Promise<ClosetItemRecord> {
  const response = await fetch(`${API_BASE_URL}/api/me/closet-items/${itemId}/image`, {
    method: "DELETE",
    headers: buildAuthHeaders(accessToken),
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  return (await response.json()) as ClosetItemRecord
}

export async function generateOutfitsFromSavedCloset(
  accessToken: string,
  payload: ProtectedGenerateOutfitsRequest
): Promise<GenerateOutfitsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/me/generate-outfits`, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  return (await response.json()) as GenerateOutfitsResponse
}

export async function listSavedOutfits(accessToken: string): Promise<SavedOutfitRecord[]> {
  const response = await fetch(`${API_BASE_URL}/api/me/saved-outfits`, {
    headers: buildAuthHeaders(accessToken),
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  return (await response.json()) as SavedOutfitRecord[]
}

export async function createSavedOutfit(
  accessToken: string,
  payload: SavedOutfitCreate
): Promise<SavedOutfitRecord> {
  const response = await fetch(`${API_BASE_URL}/api/me/saved-outfits`, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  return (await response.json()) as SavedOutfitRecord
}

export async function deleteSavedOutfit(accessToken: string, savedOutfitId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/me/saved-outfits/${savedOutfitId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(accessToken),
  })
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
}
