const KEY = "opinionpulse_recent_searches"
const MAX = 12

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((q): q is string => typeof q === "string")
      : []
  } catch {
    return []
  }
}

export function addRecentSearch(query: string): string[] {
  const trimmed = query.trim()
  if (!trimmed) return getRecentSearches()
  const next = [trimmed, ...getRecentSearches().filter((q) => q !== trimmed)].slice(
    0,
    MAX
  )
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function removeRecentSearch(query: string): string[] {
  const next = getRecentSearches().filter((q) => q !== query)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
