export const PROPERTY_FAVORITES_COOKIE = 'horizon-property-favorites'
export const PROJECT_FAVORITES_COOKIE = 'horizon-project-favorites'
export const PROPERTY_FAVORITES_MAX_AGE_DAYS = 365

export type FavoritePropertyId = string | number
/** Alias — same CRM id shape for constructions / projects. */
export type FavoriteProjectId = FavoritePropertyId

export function sameFavoriteId(a: FavoritePropertyId, b: FavoritePropertyId): boolean {
  return String(a) === String(b)
}

/** Store numeric CRM ids as numbers so the cookie reads like `[101, 205, 350]`. */
export function normalizeIdForStorage(id: FavoritePropertyId): FavoritePropertyId {
  if (typeof id === 'number' && Number.isFinite(id)) return id
  const trimmed = String(id).trim()
  if (!trimmed) return id
  const asNumber = Number(trimmed)
  if (Number.isFinite(asNumber) && String(asNumber) === trimmed) return asNumber
  return trimmed
}

export function normalizeFavoriteIds(ids: FavoritePropertyId[]): FavoritePropertyId[] {
  const seen = new Set<string>()
  const result: FavoritePropertyId[] = []

  for (const id of ids) {
    const normalized = normalizeIdForStorage(id)
    const key = String(normalized)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }

  return result
}

/** Cookie value is a plain JSON array, e.g. `[101,205,350]`. */
export function serializeFavoriteIds(ids: FavoritePropertyId[]): string {
  return JSON.stringify(normalizeFavoriteIds(ids))
}

export function parseFavoriteIds(raw: string | null | undefined): FavoritePropertyId[] {
  if (!raw) return []

  let decoded = raw.trim()
  if (!decoded) return []

  if (decoded.includes('%')) {
    try {
      decoded = decodeURIComponent(decoded)
    } catch {
      // keep raw value (legacy cookies)
    }
  }

  try {
    const parsed = JSON.parse(decoded) as unknown
    if (!Array.isArray(parsed)) return []

    return normalizeFavoriteIds(
      parsed.filter(
        (id): id is FavoritePropertyId => typeof id === 'string' || typeof id === 'number',
      ),
    )
  } catch {
    return []
  }
}

function readFavoriteIdsFromCookie(cookieName: string): FavoritePropertyId[] {
  if (typeof document === 'undefined') return []

  const escaped = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  if (!match?.[1]) return []

  return parseFavoriteIds(match[1])
}

function writeFavoriteIdsToCookie(cookieName: string, ids: FavoritePropertyId[]): void {
  if (typeof document === 'undefined') return

  const maxAge = PROPERTY_FAVORITES_MAX_AGE_DAYS * 24 * 60 * 60
  const value = serializeFavoriteIds(ids)
  document.cookie = `${cookieName}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function readFavoriteIdsFromDocument(): FavoritePropertyId[] {
  return readFavoriteIdsFromCookie(PROPERTY_FAVORITES_COOKIE)
}

export function writeFavoriteIdsToDocument(ids: FavoritePropertyId[]): void {
  writeFavoriteIdsToCookie(PROPERTY_FAVORITES_COOKIE, ids)
}

export function readProjectFavoriteIdsFromDocument(): FavoriteProjectId[] {
  return readFavoriteIdsFromCookie(PROJECT_FAVORITES_COOKIE)
}

export function writeProjectFavoriteIdsToDocument(ids: FavoriteProjectId[]): void {
  writeFavoriteIdsToCookie(PROJECT_FAVORITES_COOKIE, ids)
}

export function toggleFavoriteId(
  ids: FavoritePropertyId[],
  id: FavoritePropertyId,
): FavoritePropertyId[] {
  const normalizedId = normalizeIdForStorage(id)
  const exists = ids.some((entry) => sameFavoriteId(entry, normalizedId))
  if (exists) {
    return normalizeFavoriteIds(ids.filter((entry) => !sameFavoriteId(entry, normalizedId)))
  }
  return normalizeFavoriteIds([...ids, normalizedId])
}
