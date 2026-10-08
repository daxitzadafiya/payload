import { extractCRMList } from '@/utilities/crmProperties'
import { getCRMLocalizedText } from '@/utilities/localizedValue'

import { unwrapCRMJsonPayload } from './crmCoasts'
import type { SiteCountryOption } from './siteCountries.shared'

export type CRMCountryOption = SiteCountryOption

/** @deprecated Hero block select removed — default comes from Countries.isDefault. */
export type HeroDefaultCountrySlug = 'spain' | 'france' | 'portugal' | 'others'

const pickNumber = (candidate: unknown): number | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

const pickString = (candidate: unknown, fallback = '') =>
  typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback

/** @deprecated Prefer Countries.isDefault via resolveDefaultCountryKeys(countries). */
const DEFAULT_COUNTRY_MATCHERS: Record<Exclude<HeroDefaultCountrySlug, 'others'>, string[]> = {
  spain: ['spain', 'españa', 'espana'],
  france: ['france'],
  portugal: ['portugal'],
}

const normalizeCountry = (
  doc: Record<string, unknown>,
  locale: string,
): CRMCountryOption | null => {
  const key = pickNumber(doc.key ?? doc.key_system ?? doc.id)
  if (key === undefined) return null

  const label =
    getCRMLocalizedText(doc.value, locale) ||
    pickString(doc.name) ||
    pickString(doc.country) ||
    String(key)

  return {
    value: String(key),
    label,
    key,
    isoCode: pickString(doc.iso_code).toUpperCase() || undefined,
  }
}

/** @deprecated Live CRM fetch — prefer CMS `/api/settings/countries`. Kept for tooling/debug. */
export async function fetchCRMCountries(
  locale: string,
  init?: { signal?: AbortSignal },
): Promise<CRMCountryOption[]> {
  const lang = locale.trim() || 'en'
  const response = await fetch(`/api/crm/countries?lang=${encodeURIComponent(lang)}`, {
    signal: init?.signal,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`CRM countries failed (${response.status})`)
  }

  const raw = unwrapCRMJsonPayload((await response.json()) as unknown)
  const list = extractCRMList(raw)

  return list
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => normalizeCountry(item, lang))
    .filter((country): country is CRMCountryOption => country !== null)
    .sort((a, b) => a.label.localeCompare(b.label, lang))
}

/**
 * Resolve the Sale hero pre-selected country key(s).
 * Prefers Countries.isDefault from the CMS; falls back to legacy Hero block slug.
 */
export const resolveDefaultCountryKeys = (
  countries: CRMCountryOption[],
  legacyDefaultCountry?: string | null,
): string[] => {
  if (!countries.length) return []

  const flagged = countries.find((country) => country.isDefault === true)
  if (flagged) return [flagged.value]

  if (!legacyDefaultCountry || legacyDefaultCountry === 'others') return []

  const slug = legacyDefaultCountry as HeroDefaultCountrySlug
  const matchers =
    slug in DEFAULT_COUNTRY_MATCHERS
      ? DEFAULT_COUNTRY_MATCHERS[slug as Exclude<HeroDefaultCountrySlug, 'others'>]
      : [legacyDefaultCountry]

  const match = countries.find((country) =>
    matchers.some((term) => country.label.toLowerCase().includes(term)),
  )

  return match ? [match.value] : []
}

/**
 * Country key(s) to pre-select in a filter.
 * Uses the CMS default when it is enabled for the current transaction type,
 * otherwise falls back to the first available country.
 */
export const resolvePreselectedCountryKeys = (
  countries: CRMCountryOption[],
  legacyDefaultCountry?: string | null,
): string[] => {
  const defaultKeys = resolveDefaultCountryKeys(countries, legacyDefaultCountry)
  if (defaultKeys.length) return defaultKeys

  const first = countries[0]
  return first ? [first.value] : []
}
