const STORAGE_KEY = 'zariko-visitor-country'
/** Re-detect country every 15 minutes so travel / VPN changes are picked up. */
export const VISITOR_COUNTRY_TTL_MS = 15 * 60 * 1000

type CachedVisitorCountry = {
  countryCode: string
  cachedAt?: number
  expiresAt: number
}

function readEntry(): CachedVisitorCountry | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as CachedVisitorCountry
    if (!parsed?.countryCode || typeof parsed.expiresAt !== 'number') {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    const now = Date.now()
    const cachedAt = typeof parsed.cachedAt === 'number' ? parsed.cachedAt : 0
    // Drop expired entries and legacy 30-day caches that have no/stale cachedAt.
    if (now > parsed.expiresAt || now - cachedAt > VISITOR_COUNTRY_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function readCachedVisitorCountry(): string | null {
  return readEntry()?.countryCode.toLowerCase() ?? null
}

export function writeCachedVisitorCountry(countryCode: string): void {
  if (typeof window === 'undefined') return

  const normalized = countryCode.trim().toLowerCase()
  if (!normalized || normalized.length !== 2) return

  try {
    const now = Date.now()
    const entry: CachedVisitorCountry = {
      countryCode: normalized,
      cachedAt: now,
      expiresAt: now + VISITOR_COUNTRY_TTL_MS,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  } catch {
    // Ignore quota / private mode errors.
  }
}
