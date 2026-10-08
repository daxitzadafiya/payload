import type { CRMListingPreset, PropertyListFilters } from '@/utilities/crmProperties'
import { PROPERTY_LISTING_FEATURE_VALUES } from '@/utilities/crmProperties'
import { COMMERCIAL_PROFILE_TYPE_ONE_FIELD } from '@/utilities/propertyInquiry'
import { parseCountFilterValue } from '@/utilities/propertyFilterParsing'
import {
  parseCityFilter,
  parseCoastFilter,
  parseCountryFilter,
  parsePropertyTypeFilter,
} from '@/components/PropertyList/filterOptions'

export const SAVE_SEARCH_FLAG_FIELD = 'save_search'
export const SAVE_SEARCH_SUMMARY_FIELD = 'search_criteria'

export type SaveSearchLabelMaps = {
  coasts?: Record<string, string>
  cities?: Record<string, string>
  countries?: Record<string, string>
  propertyTypes?: Record<string, string>
}

function resolveTransactionType(preset: CRMListingPreset): string {
  switch (preset) {
    case 'forHoliday':
      return 'holiday rental'
    case 'forRent':
      return 'long term rental'
    default:
      return 'Buy'
  }
}

function formatPrice(value?: string): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === 'any') return undefined
  const num = Number(trimmed)
  if (!Number.isFinite(num)) return trimmed
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(num)
}

function joinLabels(keys: string[], labels?: Record<string, string>): string {
  return keys
    .map((key) => labels?.[key]?.trim() || key)
    .filter(Boolean)
    .join(', ')
}

function resolveListingLabel(preset: CRMListingPreset): string {
  switch (preset) {
    case 'forSale':
      return 'Property for Sale'
    case 'forRent':
      return 'Property for Rent'
    case 'forHoliday':
      return 'Holiday Rentals'
    case 'sold':
      return 'Sold Properties'
    case 'projects':
      return 'Projects'
    case 'favorites':
      return 'Favorites'
    case 'featured':
      return 'Featured'
    case 'seaView':
      return 'Sea View'
    case 'beachSide':
      return 'Beach Side'
    case 'golf':
      return 'Golf Properties'
    case 'luxury':
      return 'Luxury Properties'
    case 'newDevelopments':
      return 'New Developments'
    case 'newListings':
      return 'New Listings'
    case 'cityWise':
      return 'City-wise Properties'
    case 'resaleHomes':
      return 'Resale Homes'
    case 'custom':
      return 'Custom CRM Query'
    default:
      return preset
  }
}

function isMeaningfulFilterValue(value?: string): boolean {
  const trimmed = value?.trim()
  return Boolean(trimmed && trimmed.toLowerCase() !== 'any')
}

function buildSearchCriteriaSummary(
  filters: PropertyListFilters,
  listingPreset: CRMListingPreset,
  labels?: SaveSearchLabelMaps,
): string {
  const parts: string[] = [`Listing: ${resolveListingLabel(listingPreset)}`]

  const countries = parseCountryFilter(filters.country)
  if (countries.length) parts.push(`Country: ${joinLabels(countries, labels?.countries)}`)

  const coasts = parseCoastFilter(filters.coast)
  if (coasts.length) parts.push(`Coast: ${joinLabels(coasts, labels?.coasts)}`)

  const cities = parseCityFilter(filters.city)
  if (cities.length) parts.push(`City: ${joinLabels(cities, labels?.cities)}`)

  const types = parsePropertyTypeFilter(filters.propertyType)
  if (types.length) parts.push(`Type: ${joinLabels(types, labels?.propertyTypes)}`)

  const priceFrom = formatPrice(filters.minPrice)
  const priceTo = formatPrice(filters.maxPrice)
  if (priceFrom || priceTo) {
    parts.push(`Price: ${priceFrom ?? 'Any'} – ${priceTo ?? 'Any'}`)
  }

  const bedrooms = parseCountFilterValue(filters.bedrooms, filters.bedroomsCustom)
  if (bedrooms !== undefined) parts.push(`Bedrooms: ${bedrooms}+`)

  const bathrooms = parseCountFilterValue(filters.bathrooms, filters.bathroomsCustom)
  if (bathrooms !== undefined) parts.push(`Bathrooms: ${bathrooms}+`)

  const features = (filters.features ?? []).filter(
    (item) =>
      item &&
      item !== 'any' &&
      (PROPERTY_LISTING_FEATURE_VALUES as readonly string[]).includes(item),
  )
  if (features.length) parts.push(`Features: ${features.join(', ')}`)

  if (isMeaningfulFilterValue(filters.reference)) {
    parts.push(`Reference: ${filters.reference!.trim()}`)
  }
  if (isMeaningfulFilterValue(filters.delivery)) {
    parts.push(`Delivery: ${filters.delivery!.trim()}`)
  }
  if (isMeaningfulFilterValue(filters.distanceToSea)) {
    parts.push(`Distance to sea: ${filters.distanceToSea!.trim()}m`)
  }
  if (isMeaningfulFilterValue(filters.periodFrom)) {
    parts.push(`Arrival: ${filters.periodFrom!.trim()}`)
  }
  if (isMeaningfulFilterValue(filters.periodTo)) {
    parts.push(`Departure: ${filters.periodTo!.trim()}`)
  }
  if (filters.guests && filters.guests !== 'any') {
    const guests =
      parseCountFilterValue(filters.guests, filters.guestsCustom) ??
      filters.guestsCustom ??
      filters.guests
    parts.push(`Guests: ${guests}`)
  }
  if (filters.totalBudget && filters.totalBudget !== 'any') {
    parts.push(`Total budget: ${filters.totalBudget}`)
  }

  return parts.join('\n')
}

/**
 * Hidden submission fields for save-search → Optima CRM accounts/index + notification emails.
 * Mirrors gestali-home SiteController::mergeParams + saveAccount field mapping.
 */
export function buildSaveSearchHiddenFields(
  filters: PropertyListFilters,
  listingPreset: CRMListingPreset,
  labels?: SaveSearchLabelMaps,
): Array<{ field: string; value: string | boolean }> {
  const fields: Array<{ field: string; value: string | boolean }> = [
    { field: SAVE_SEARCH_FLAG_FIELD, value: 'true' },
    { field: 'message', value: 'Save search' },
    { field: 'subject', value: 'Save search' },
    { field: 'p_type', value: 'commercial_property' },
    { field: 'transaction_types', value: resolveTransactionType(listingPreset) },
    { field: 'source', value: 'web-client' },
    { field: 'gdpr_status', value: true },
  ]

  const summary = buildSearchCriteriaSummary(filters, listingPreset, labels)
  if (summary.trim()) {
    fields.push({ field: SAVE_SEARCH_SUMMARY_FIELD, value: summary })
  }

  const cities = parseCityFilter(filters.city)
  if (cities.length) fields.push({ field: 'cities', value: cities.join(',') })

  const coasts = parseCoastFilter(filters.coast)
  if (coasts.length) fields.push({ field: 'lgroups', value: coasts.join(',') })

  const countries = parseCountryFilter(filters.country)
  if (countries.length) fields.push({ field: 'countries', value: countries.join(',') })

  const types = parsePropertyTypeFilter(filters.propertyType)
  if (types.length) {
    fields.push({ field: COMMERCIAL_PROFILE_TYPE_ONE_FIELD, value: types.join(',') })
  }

  const minPrice = filters.minPrice?.trim()
  if (minPrice && minPrice !== 'any') fields.push({ field: 'budget_min', value: minPrice })

  const maxPrice = filters.maxPrice?.trim()
  if (maxPrice && maxPrice !== 'any') fields.push({ field: 'budget_max', value: maxPrice })

  const bedrooms = parseCountFilterValue(filters.bedrooms, filters.bedroomsCustom)
  if (bedrooms !== undefined) fields.push({ field: 'min_bedrooms', value: String(bedrooms) })

  const bathrooms = parseCountFilterValue(filters.bathrooms, filters.bathroomsCustom)
  if (bathrooms !== undefined) fields.push({ field: 'min_bathrooms', value: String(bathrooms) })

  const features = (filters.features ?? []).filter((item) => item && item !== 'any')
  const views: string[] = []
  const feetCategories: string[] = []

  for (const feature of features) {
    if (feature === 'sea views') views.push('sea')
    else if (feature === 'mountain') views.push('mountain')
    else if (feature === 'golf') feetCategories.push('golf')
  }

  if (views.length) fields.push({ field: 'feet_views', value: views.join(',') })
  if (feetCategories.length) fields.push({ field: 'feet_categories', value: feetCategories.join(',') })

  if (listingPreset === 'forHoliday') {
    if (filters.periodFrom?.trim()) {
      fields.push({ field: 'rent_from_date', value: filters.periodFrom.trim() })
    }
    if (filters.periodTo?.trim()) {
      fields.push({ field: 'rent_to_date', value: filters.periodTo.trim() })
    }
    const guests = parseCountFilterValue(filters.guests, filters.guestsCustom)
    if (guests !== undefined) fields.push({ field: 'min_sleeps', value: String(guests) })
  }

  return fields
}

/** Form field names that stay hidden for save-search (criteria go via hidden CRM fields). */
export const SAVE_SEARCH_OMIT_FORM_FIELDS = ['subject', 'message'] as const
