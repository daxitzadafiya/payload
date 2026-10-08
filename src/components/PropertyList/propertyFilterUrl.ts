import type { PropertyListFilters } from '@/utilities/crmProperties'
import {
  appendForQueryToDetailHref,
  type PropertyDetailListingContext,
} from '@/utilities/propertyDetailListingContext'

import {
  EMPTY_PROPERTY_FILTERS,
  parseCityFilter,
  parseCoastFilter,
  parseCountryFilter,
  parseFeaturesFilter,
  parsePropertyTypeFilter,
} from './filterOptions'

const PENDING_FILTERS_STORAGE_KEY = 'propertyList.pendingFilters'

/** Survives React Strict Mode remounts after hero → listing navigation. */
let pendingFiltersMemory: PropertyListFilters | null | undefined

export const normalizePropertyListFilters = (
  filters: PropertyListFilters,
): PropertyListFilters => ({
  ...EMPTY_PROPERTY_FILTERS,
  ...filters,
  reference: filters.reference?.trim() ?? '',
  propertyType: parsePropertyTypeFilter(filters.propertyType),
  country: parseCountryFilter(filters.country),
  coast: parseCoastFilter(filters.coast),
  city: parseCityFilter(filters.city),
  minPrice: filters.minPrice && filters.minPrice !== 'any' ? filters.minPrice : 'any',
  maxPrice: filters.maxPrice && filters.maxPrice !== 'any' ? filters.maxPrice : 'any',
  bedrooms: filters.bedrooms && filters.bedrooms !== 'any' ? filters.bedrooms : 'any',
  bedroomsCustom: filters.bedroomsCustom?.trim() ?? '',
  bathrooms: filters.bathrooms && filters.bathrooms !== 'any' ? filters.bathrooms : 'any',
  bathroomsCustom: filters.bathroomsCustom?.trim() ?? '',
  features: parseFeaturesFilter(filters.features),
  mapReferences: Array.isArray(filters.mapReferences)
    ? filters.mapReferences.filter(Boolean)
    : [],
  periodFrom: filters.periodFrom?.trim() ?? '',
  periodTo: filters.periodTo?.trim() ?? '',
  guests: filters.guests && filters.guests !== 'any' ? filters.guests : 'any',
  guestsCustom: filters.guestsCustom?.trim() ?? '',
  totalBudget: filters.totalBudget && filters.totalBudget !== 'any' ? filters.totalBudget : 'any',
})

export const savePendingPropertyListFilters = (filters: PropertyListFilters): void => {
  if (typeof window === 'undefined') return
  pendingFiltersMemory = undefined
  const normalized = normalizePropertyListFilters(filters)
  sessionStorage.setItem(PENDING_FILTERS_STORAGE_KEY, JSON.stringify(normalized))
}

/**
 * Read pending filters from hero search (sessionStorage). No URL params.
 * Cached in memory so React Strict Mode does not drop filters on remount.
 */
export const takePendingPropertyListFilters = (): PropertyListFilters | null => {
  if (pendingFiltersMemory !== undefined) {
    return pendingFiltersMemory
  }

  if (typeof window === 'undefined') {
    pendingFiltersMemory = null
    return null
  }

  const raw = sessionStorage.getItem(PENDING_FILTERS_STORAGE_KEY)
  if (!raw) {
    pendingFiltersMemory = null
    return null
  }

  sessionStorage.removeItem(PENDING_FILTERS_STORAGE_KEY)

  try {
    pendingFiltersMemory = normalizePropertyListFilters(JSON.parse(raw) as PropertyListFilters)
    return pendingFiltersMemory
  } catch {
    pendingFiltersMemory = null
    return null
  }
}

/** @deprecated Prefer takePendingPropertyListFilters */
export const consumePendingPropertyListFilters = (): PropertyListFilters | null =>
  takePendingPropertyListFilters()

export const clearPendingPropertyListFilters = (): void => {
  pendingFiltersMemory = undefined
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PENDING_FILTERS_STORAGE_KEY)
}

export const stripPropertyFilterSearchParams = (): void => {
  if (typeof window === 'undefined' || !window.location.search) return
  window.history.replaceState(null, '', window.location.pathname)
}

const splitCsv = (value: string | null): string[] =>
  value
    ? value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : []

export const serializePropertyFiltersToSearchParams = (
  filters: PropertyListFilters,
): URLSearchParams => {
  const params = new URLSearchParams()

  const reference = filters.reference?.trim()
  if (reference) params.set('reference', reference)

  if (filters.propertyType?.length) params.set('propertyType', filters.propertyType.join(','))

  if (filters.country?.length) params.set('country', filters.country[0]!)
  if (filters.coast?.length) params.set('coast', filters.coast.join(','))
  if (filters.city?.length) params.set('city', filters.city.join(','))

  if (filters.minPrice && filters.minPrice !== 'any') params.set('minPrice', filters.minPrice)
  if (filters.maxPrice && filters.maxPrice !== 'any') params.set('maxPrice', filters.maxPrice)

  if (filters.bedrooms && filters.bedrooms !== 'any') params.set('bedrooms', filters.bedrooms)
  if (filters.bedroomsCustom?.trim()) params.set('bedroomsCustom', filters.bedroomsCustom.trim())
  if (filters.bathrooms && filters.bathrooms !== 'any') params.set('bathrooms', filters.bathrooms)
  if (filters.bathroomsCustom?.trim()) params.set('bathroomsCustom', filters.bathroomsCustom.trim())
  if (filters.features?.length) params.set('features', filters.features.join(','))

  if (filters.periodFrom?.trim()) params.set('periodFrom', filters.periodFrom.trim())
  if (filters.periodTo?.trim()) params.set('periodTo', filters.periodTo.trim())
  if (filters.guests && filters.guests !== 'any') params.set('guests', filters.guests)
  if (filters.guestsCustom?.trim()) params.set('guestsCustom', filters.guestsCustom.trim())
  if (filters.totalBudget && filters.totalBudget !== 'any') {
    params.set('totalBudget', filters.totalBudget)
  }

  return params
}

export const parsePropertyFiltersFromSearchParams = (
  searchParams: Pick<URLSearchParams, 'get'>,
): PropertyListFilters => {
  const filters: PropertyListFilters = { ...EMPTY_PROPERTY_FILTERS }

  const reference = searchParams.get('reference')
  if (reference) filters.reference = reference

  const location = splitCsv(searchParams.get('location'))
  if (location.length) {
    filters.coast = location
  }

  const coast = splitCsv(searchParams.get('coast'))
  if (coast.length) filters.coast = coast

  const country = splitCsv(searchParams.get('country'))
  if (country.length) filters.country = parseCountryFilter(country)

  const city = splitCsv(searchParams.get('city'))
  if (city.length) filters.city = city

  const propertyType = splitCsv(searchParams.get('propertyType'))
  if (propertyType.length) filters.propertyType = propertyType

  const minPrice = searchParams.get('minPrice')
  if (minPrice) filters.minPrice = minPrice

  const maxPrice = searchParams.get('maxPrice')
  if (maxPrice) filters.maxPrice = maxPrice

  const bedrooms = searchParams.get('bedrooms')
  if (bedrooms) filters.bedrooms = bedrooms

  const bedroomsCustom = searchParams.get('bedroomsCustom')
  if (bedroomsCustom) filters.bedroomsCustom = bedroomsCustom

  const bathrooms = searchParams.get('bathrooms')
  if (bathrooms) filters.bathrooms = bathrooms

  const bathroomsCustom = searchParams.get('bathroomsCustom')
  if (bathroomsCustom) filters.bathroomsCustom = bathroomsCustom

  const features = splitCsv(searchParams.get('features'))
  if (features.length) filters.features = features

  const periodFrom = searchParams.get('periodFrom')
  if (periodFrom) filters.periodFrom = periodFrom

  const periodTo = searchParams.get('periodTo')
  if (periodTo) filters.periodTo = periodTo

  const guests = searchParams.get('guests')
  if (guests) filters.guests = guests

  const guestsCustom = searchParams.get('guestsCustom')
  if (guestsCustom) filters.guestsCustom = guestsCustom

  const totalBudget = searchParams.get('totalBudget')
  if (totalBudget) filters.totalBudget = totalBudget

  return filters
}

export const buildPropertyListUrl = (path: string, filters: PropertyListFilters): string => {
  const params = serializePropertyFiltersToSearchParams(filters)
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

/** Append holiday search params to a property detail href when present. */
export const appendHolidayParamsToHref = (
  href: string | undefined,
  filters: Pick<PropertyListFilters, 'periodFrom' | 'periodTo' | 'guests' | 'guestsCustom'>,
): string | undefined => {
  if (!href) return href

  const hasHolidayParams =
    filters.periodFrom?.trim() ||
    filters.periodTo?.trim() ||
    (filters.guests && filters.guests !== 'any')

  if (!hasHolidayParams) return href

  const params = serializePropertyFiltersToSearchParams({
    ...EMPTY_PROPERTY_FILTERS,
    periodFrom: filters.periodFrom,
    periodTo: filters.periodTo,
    guests: filters.guests,
    guestsCustom: filters.guestsCustom,
  })

  const qs = params.toString()
  if (!qs) return href

  return href.includes('?') ? `${href}&${qs}` : `${href}?${qs}`
}

/** Append `?for=` listing context and optional holiday search params to detail hrefs. */
export const appendListingContextToDetailHref = (
  href: string | undefined,
  listingContext?: PropertyDetailListingContext,
  filters?: Pick<PropertyListFilters, 'periodFrom' | 'periodTo' | 'guests'>,
): string | undefined => {
  const withContext = appendForQueryToDetailHref(href, listingContext)
  return appendHolidayParamsToHref(withContext, filters ?? {})
}

