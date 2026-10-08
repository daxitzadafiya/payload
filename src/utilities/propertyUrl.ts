import { buildCRMLocaleCandidates, getLocalizedText, isCRMTruthy } from '@/utilities/localizedValue'

export type PropertyListingMode = 'sale' | 'rent'

type LocalizedUrlMap = Record<string, string>

type PropertyUrlMaps = {
  urlsWithoutDomain?: Record<string, LocalizedUrlMap>
  propertyUrls?: Record<string, LocalizedUrlMap>
}

const PROPERTY_URL_KEYS = {
  sale: 'sale_url',
  rent: 'rent_url',
} as const

const PROPERTY_DETAILS_PATH = '/property-details'
const PROJECT_DETAILS_PATH = '/project-details'

/** Extract numeric CRM reference from a URL slug (e.g. `luxury-villa-in-calpe_618268` → `618268`). */
export function extractReferenceFromSlug(slug: string): string {
  const segment = decodeURIComponent(slug).split('?')[0]?.split('/').pop() ?? slug
  const match = segment.match(/_(\d+)$/)
  if (match) return match[1]
  return segment.replace(/^_/, '').trim()
}

function readPropertyUrlMaps(property: Record<string, unknown>): PropertyUrlMaps {
  const urlsWithoutDomain = property.urls_without_domain
  const propertyUrls = property.property_urls

  return {
    urlsWithoutDomain:
      urlsWithoutDomain && typeof urlsWithoutDomain === 'object' && !Array.isArray(urlsWithoutDomain)
        ? (urlsWithoutDomain as Record<string, LocalizedUrlMap>)
        : undefined,
    propertyUrls:
      propertyUrls && typeof propertyUrls === 'object' && !Array.isArray(propertyUrls)
        ? (propertyUrls as Record<string, LocalizedUrlMap>)
        : undefined,
  }
}

function pickLocalizedUrlValue(
  urlMap: LocalizedUrlMap | undefined,
  locale: string,
): string | undefined {
  if (!urlMap || typeof urlMap !== 'object') return undefined

  const candidates = buildCRMLocaleCandidates(locale)
  const entries = Object.entries(urlMap)

  for (const candidate of candidates) {
    const direct = urlMap[candidate]
    if (typeof direct === 'string' && direct.trim()) return direct.trim()

    const match = entries.find(([key]) => key.toLowerCase() === candidate.toLowerCase())
    if (match && typeof match[1] === 'string' && match[1].trim()) {
      return match[1].trim()
    }
  }

  const fallback = urlMap.en ?? urlMap.EN
  return typeof fallback === 'string' && fallback.trim() ? fallback.trim() : undefined
}

function normalizeCrmUrlPath(value: string): string {
  const trimmed = value.trim().split('?')[0] ?? ''
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const pathname = new URL(trimmed).pathname
      return pathname.replace(/^\/+/, '')
    } catch {
      return trimmed
    }
  }

  return trimmed.replace(/^\/+/, '')
}

function extractSlugFromCrmPath(path: string): string | undefined {
  const normalized = normalizeCrmUrlPath(path)
  if (!normalized) return undefined

  const slug = normalized.split('/').filter(Boolean).pop()
  return slug || undefined
}

function isBareReferenceSlug(slug: string): boolean {
  return /^_\d+$/.test(slug)
}

/** Listing rows from Optima are often `{ property: { ... } }` without top-level identity fields. */
function ensureFlatPropertyRecord(property: Record<string, unknown>): Record<string, unknown> {
  const nested = property.property
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) return property

  const inner = nested as Record<string, unknown>
  const hasTopLevelIdentity = property.reference != null || property._id != null || property.id != null
  const hasNestedIdentity = inner.reference != null || inner._id != null || inner.id != null

  if (hasNestedIdentity && !hasTopLevelIdentity) return inner

  return property
}

function pickPropertyReference(property: Record<string, unknown>): string | undefined {
  const referenceRaw = property.reference ?? property.id
  if (typeof referenceRaw === 'number' && Number.isFinite(referenceRaw)) {
    return String(referenceRaw)
  }
  if (typeof referenceRaw === 'string' && referenceRaw.trim()) {
    return referenceRaw.trim()
  }
  return undefined
}

function slugifyPropertySegment(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function pickPropertyTitleForSlug(
  property: Record<string, unknown>,
  locale: string,
  mode: PropertyListingMode,
): string {
  const saleFirst = mode === 'sale'
  const fields = saleFirst
    ? [
        'sale_title',
        'title',
        'project_name',
        'perma_link',
        'rental_title',
        'property_name',
        'name',
        'display_name',
      ]
    : [
        'rental_title',
        'rent_title',
        'title',
        'sale_title',
        'project_name',
        'property_name',
        'name',
        'display_name',
      ]

  for (const field of fields) {
    const value = property[field]
    const text =
      typeof value === 'string'
        ? value.trim()
        : getLocalizedText(value, locale, '').trim()
    if (text) return text
  }

  return ''
}

function buildPropertyDetailSlugFromTitle(
  property: Record<string, unknown>,
  locale: string,
  mode: PropertyListingMode,
): string | undefined {
  const reference = pickPropertyReference(property)
  if (!reference) return undefined

  const titleSlug = slugifyPropertySegment(pickPropertyTitleForSlug(property, locale, mode))
  if (!titleSlug) return undefined

  return `${titleSlug}_${reference}`
}

function getLocalizedUrlPath(
  maps: PropertyUrlMaps,
  locale: string,
  mode: PropertyListingMode,
): string | undefined {
  const urlKey = PROPERTY_URL_KEYS[mode]

  const pathWithoutDomain = pickLocalizedUrlValue(maps.urlsWithoutDomain?.[urlKey], locale)
  if (pathWithoutDomain) return normalizeCrmUrlPath(pathWithoutDomain)

  const fullUrl = pickLocalizedUrlValue(maps.propertyUrls?.[urlKey], locale)
  if (fullUrl) return normalizeCrmUrlPath(fullUrl)

  return undefined
}

/** Prefer sale URL slug when property is for sale, otherwise rent URL slug. */
export function resolvePropertyListingMode(property: Record<string, unknown>): PropertyListingMode {
  if (isCRMTruthy(property.sale)) return 'sale'
  if (isCRMTruthy(property.rent)) return 'rent'
  return 'sale'
}

export function getPropertyDetailSlug(
  property: Record<string, unknown>,
  locale: string,
  mode: PropertyListingMode = 'sale',
): string | undefined {
  const maps = readPropertyUrlMaps(property)
  const primaryPath = getLocalizedUrlPath(maps, locale, mode)
  const primarySlug = primaryPath ? extractSlugFromCrmPath(primaryPath) : undefined

  if (primarySlug && !isBareReferenceSlug(primarySlug)) {
    return primarySlug
  }

  const alternateMode: PropertyListingMode = mode === 'sale' ? 'rent' : 'sale'
  const alternatePath = getLocalizedUrlPath(maps, locale, alternateMode)
  const alternateSlug = alternatePath ? extractSlugFromCrmPath(alternatePath) : undefined

  if (alternateSlug && !isBareReferenceSlug(alternateSlug)) {
    return alternateSlug
  }

  return undefined
}

function buildDetailHrefForPath(
  pathPrefix: string,
  property: Record<string, unknown>,
  locale: string,
  options?: { listingMode?: PropertyListingMode },
): string | undefined {
  const flatProperty = ensureFlatPropertyRecord(property)
  const listingMode = options?.listingMode ?? resolvePropertyListingMode(flatProperty)
  const slug = getPropertyDetailSlug(flatProperty, locale, listingMode)

  if (slug && !isBareReferenceSlug(slug)) {
    return `${pathPrefix}/${encodeURIComponent(slug)}`
  }

  const titleSlug = buildPropertyDetailSlugFromTitle(flatProperty, locale, listingMode)
  if (titleSlug) {
    return `${pathPrefix}/${encodeURIComponent(titleSlug)}`
  }

  const reference = pickPropertyReference(flatProperty)
  if (!reference) return undefined

  return `${pathPrefix}/_${reference}`
}

/** Public site href — `/property-details/{slug}`. `?ttype=` is dropped; listing pages append `?for=`. */
export function resolvePropertyDetailHref(
  property: Record<string, unknown>,
  locale: string,
  options?: { listingMode?: PropertyListingMode },
): string | undefined {
  return buildDetailHrefForPath(PROPERTY_DETAILS_PATH, property, locale, options)
}

/**
 * Public project href — `/project-details/{slug}_{id}` (pedro development URL pattern).
 * Uses perma_link / title + numeric reference when CRM sale_url maps are absent.
 */
export function resolveProjectDetailHref(
  property: Record<string, unknown>,
  locale: string,
): string | undefined {
  const flatProperty = ensureFlatPropertyRecord(property)

  // Prefer construction perma_link / title slug (same {slug}_{id} shape as pedro).
  const titleSlug = buildPropertyDetailSlugFromTitle(flatProperty, locale, 'sale')
  if (titleSlug) {
    return `${PROJECT_DETAILS_PATH}/${encodeURIComponent(titleSlug)}`
  }

  return buildDetailHrefForPath(PROJECT_DETAILS_PATH, flatProperty, locale, {
    listingMode: 'sale',
  })
}

export { PROJECT_DETAILS_PATH, PROPERTY_DETAILS_PATH }
