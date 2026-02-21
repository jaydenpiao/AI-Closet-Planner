function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function formatClosetBadgeLabel(name: string, color?: string | null): string {
  const trimmedName = name.trim()
  const normalizedColor = color?.trim().toLowerCase()

  if (!normalizedColor) {
    return trimmedName
  }

  const colorPattern = new RegExp(`\\b${escapeRegExp(normalizedColor)}\\b`, "i")
  if (colorPattern.test(trimmedName.toLowerCase())) {
    return trimmedName
  }

  return `${trimmedName} (${color?.trim()})`
}
