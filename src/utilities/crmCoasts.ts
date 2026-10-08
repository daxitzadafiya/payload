import { extractCRMList, type CRMListingPreset } from '@/utilities/crmProperties'
import { getCRMLocalizedText } from '@/utilities/localizedValue'

export type CRMCoastOption = {
  value: string
  label: string
  keySystem: number
}

export type CRMCityOption = {
  value: string
  label: string
  key: number
}

const pickNumber = (candidate: unknown): number | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

/** Optima sometimes returns JSON-encoded strings instead of parsed objects. */
export const unwrapCRMJsonPayload = (payload: unknown): unknown => {
  if (typeof payload !== 'string') return payload

  try {
    return JSON.parse(payload) as unknown
  } catch {
    return payload
  }
}

const normalizeCoast = (doc: Record<string, unknown>): CRMCoastOption | null => {
  const keySystem = pickNumber(doc.key_system)
  if (keySystem === undefined) return null

  const label =
    (typeof doc.value === 'string' && doc.value.trim()) ||
    getCRMLocalizedText(doc.value_group, 'en') ||
    String(keySystem)

  return {
    value: String(keySystem),
    label,
    keySystem,
  }
}

const normalizeCity = (doc: Record<string, unknown>, locale: string): CRMCityOption | null => {
  const key = pickNumber(doc.key)
  if (key === undefined) return null

  const label =
    getCRMLocalizedText(doc.value, locale) ||
    getCRMLocalizedText(doc.accent_value, locale) ||
    String(key)

  return {
    value: String(key),
    label,
    key,
  }
}

export async function fetchCRMCoasts(
  countryKeys?: string[],
  init?: { signal?: AbortSignal },
): Promise<CRMCoastOption[]> {
  const params = new URLSearchParams()
  // CRM only accepts a single country key.
  const country = (countryKeys ?? []).map((key) => key.trim()).find(Boolean)
  if (country) params.set('country', country)

  const query = params.toString()
  const response = await fetch(
    query ? `/api/crm/location-groups?${query}` : '/api/crm/location-groups',
    {
      signal: init?.signal,
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error(`CRM location groups failed (${response.status})`)
  }

  const raw = unwrapCRMJsonPayload((await response.json()) as unknown)
  const list = Array.isArray(raw) ? raw : extractCRMList(raw)

  return list
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => normalizeCoast(item))
    .filter((coast): coast is CRMCoastOption => coast !== null)
    .sort((a, b) => a.label.localeCompare(b.label, 'en'))
}

export const resolveLocationGroupKeys = (
  coast: string[] | undefined,
  coasts: CRMCoastOption[],
): number[] => {
  if (!coasts.length) return []

  const selected = (coast ?? []).map((value) => Number(value)).filter((key) => Number.isFinite(key))

  if (!selected.length) {
    return coasts.map((item) => item.keySystem)
  }

  return selected
}

export async function fetchCRMCities(
  locationGroupKeys: number[],
  locale: string,
  preset: CRMListingPreset = 'forSale',
  init?: { signal?: AbortSignal },
): Promise<CRMCityOption[]> {
  if (!locationGroupKeys.length) return []

  const response = await fetch('/api/crm/location-group-cities', {
    method: 'POST',
    signal: init?.signal,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locationGroup: locationGroupKeys,
      preset,
    }),
  })

  if (!response.ok) {
    throw new Error(`CRM cities failed (${response.status})`)
  }

  const raw = unwrapCRMJsonPayload((await response.json()) as unknown)
  const list = extractCRMList(raw)

  const cityByKey = new Map<number, CRMCityOption>()

  for (const doc of list) {
    const city = normalizeCity(doc, locale)
    if (city) cityByKey.set(city.key, city)
  }

  return [...cityByKey.values()].sort((a, b) => a.label.localeCompare(b.label, locale))
}
