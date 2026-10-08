import { getFromCRM, postToCRM } from '@/utilities/crmApi'
import { crmListingBodyToSearchParams } from '@/utilities/crmPropertiesGetParams'
import { getSimilarCommercialsQuery, resolveOptimaCrmSettings } from '@/settings/optimaCrm/client'
import { resolvePropertyDisplayReference } from '@/settings/optimaCrm/shared'
import {
  getPublishedPropertyAttachmentImage,
  getPublishedPropertyAttachmentImages,
  PROPERTY_CARD_IMAGE_SIZE,
  PROPERTY_DETAIL_IMAGE_SIZE,
} from '@/utilities/optimaImage'
import { getCRMLocalizedText, isCRMTruthy, resolveCRMPropertyLocalizedTexts } from '@/utilities/localizedValue'
import {
  resolveProjectDetailHref,
  resolvePropertyDetailHref,
  resolvePropertyListingMode,
  type PropertyListingMode,
} from '@/utilities/propertyUrl'
import {
  HOLIDAY_SELECT_DATES_LABEL,
  PRICE_ON_DEMAND_LABEL,
  resolveHolidayGuestsFilterCount,
  resolveHolidayPriceDisplay,
} from '@/utilities/crmHoliday'
import { formatPriceAmount } from '@/utilities/formatPriceAmount'
import { PRICE_ON_REQUEST_LABEL } from '@/utilities/localizePropertyPrice'
import {
  arrivalDateKeyToUnixSeconds,
  departureDateKeyToUnixSeconds,
} from '@/utilities/holidayStayTimes'
import { parseCountFilterValue, resolveHolidayBudgetRange } from '@/utilities/propertyFilterParsing'

export type CRMListingPreset =
  | 'forSale'
  | 'forRent'
  | 'forHoliday'
  | 'sold'
  | 'featured'
  | 'seaView'
  | 'beachSide'
  | 'golf'
  | 'luxury'
  | 'newDevelopments'
  | 'newListings'
  | 'cityWise'
  | 'resaleHomes'
  | 'custom'
  | 'favorites'
  | 'projects'

export type PropertyListSort = string

export type PropertyListFilters = {
  reference?: string
  propertyType?: string[]
  /** Selected country keys from CRM */
  country?: string[]
  /** Selected coast (location group) key_system values */
  coast?: string[]
  /** Selected city keys from CRM */
  city?: string[]
  minPrice?: string
  maxPrice?: string
  bedrooms?: string
  /** Custom bedroom count when `bedrooms` is `other` */
  bedroomsCustom?: string
  bathrooms?: string
  /** Custom bathroom count when `bathrooms` is `other` */
  bathroomsCustom?: string
  /** View features: `sea views`, `mountain`, `golf` */
  features?: string[]
  /** Property references selected via map polygon draw */
  mapReferences?: string[]
  /** Projects: delivery months (1 = key ready / handover) → phase_built_year */
  delivery?: string
  /** Projects: max sea distance in meters → distances_sea */
  distanceToSea?: string
  /** Holiday rental arrival date (YYYY-MM-DD) → CRM `rental_period_from` (unix seconds) */
  periodFrom?: string
  /** Holiday rental departure date (YYYY-MM-DD) → CRM `rental_period_to` (unix seconds) */
  periodTo?: string
  /**
   * Guest count → CRM `sleeps: { $exists: true, $gte: N }` (omit when `any`).
   * Use `guestsCustom` when value is `other`.
   */
  guests?: string
  /** Custom guest count when `guests` is `other` (clamped 1–25). */
  guestsCustom?: string
  /**
   * Total budget range.
   * Budget only → CRM `period_seasons_price` / `_from` / `_to`.
   * With a complete stay period → CRM `rental_new_price` (`"min, max"`) plus period dates.
   */
  totalBudget?: string
}

export const hasHolidayListingFilters = (filters?: PropertyListFilters): boolean =>
  Boolean(
    filters?.periodFrom?.trim() ||
    filters?.periodTo?.trim() ||
    (filters?.guests && filters.guests !== 'any') ||
    (filters?.totalBudget && filters.totalBudget !== 'any'),
  )

export type NormalizedListProperty = {
  id?: string
  imageUrl?: string
  /** All CRM attachment image URLs (ordered); used for card image slider */
  imageUrls?: string[]
  isNewListing?: boolean
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
  /** Raw CRM status e.g. Sold, Under Offer — used for detail API fetch without URL params. */
  crmStatus?: string
  location: string
  city?: string
  reference?: string
  /** Admin-selected REF for UI (lists/carousels/details); falls back to system reference. */
  displayReference?: string
  /** Site path e.g. `/property-details/luxury-villa-in-calpe_618268` */
  detailHref?: string
  title: string
  propertyType?: string
  beds?: number
  baths?: number
  /** Holiday rental capacity from CRM `sleeps` (max guests). */
  sleeps?: number
  sqft?: number | string
  price: string
  priceValue?: number
  /** Holiday rental total summary when dates are selected on listing */
  holidayPriceSummary?: string
  createdAt?: string
}

export type CRMFetchResult = {
  properties: Record<string, unknown>[]
  total: number
}

const pickString = (candidate: unknown, fallback = '') =>
  typeof candidate === 'string' && candidate.trim() ? candidate : fallback

const pickNumber = (candidate: unknown) => {
  if (typeof candidate === 'number') return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const toEpochSeconds = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value)
  }
  if (typeof value === 'string' && value.trim()) {
    const asNumber = Number(value)
    if (Number.isFinite(asNumber)) {
      return asNumber > 1_000_000_000_000 ? Math.floor(asNumber / 1000) : Math.floor(asNumber)
    }
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return Math.floor(parsed / 1000)
  }
  return undefined
}

const pickActiveLongTermRentalSeason = (
  property: Record<string, unknown>,
): Record<string, unknown> | undefined => {
  const seasonsRaw = Array.isArray(property.rental_season_data)
    ? property.rental_season_data
    : Array.isArray(property.period_seasons)
      ? property.period_seasons
      : []
  const seasons = seasonsRaw.filter(
    (item): item is Record<string, unknown> => !!item && typeof item === 'object',
  )
  if (!seasons.length) return undefined

  const now = Math.floor(Date.now() / 1000)
  return seasons.find((season) => {
    const from = toEpochSeconds(season.period_from)
    const to = toEpochSeconds(season.period_to)
    if (from == null || to == null) return false
    return now >= from && now <= to
  })
}

const isPriceOnDemandEnabled = (value: unknown) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true'
  }
  return false
}

export const resolveCRMStatusBadgeLabel = (status: unknown): 'SOLD' | 'RESERVED' | undefined => {
  const normalizedStatus = pickString(status).toLowerCase()
  if (normalizedStatus === 'sold') return 'SOLD'
  if (normalizedStatus === 'under offer') return 'RESERVED'
  return undefined
}

/** Fixes common MongoDB paste patterns from admin (e.g. `{$ne: true}` → `{"$ne": true}`). */
export const normalizeCRMCustomQueryText = (raw: string): string => {
  let text = raw.trim()
  text = text.replace(/\{\s*(\$\w+)\s*:/g, '{"$1":')
  text = text.replace(/,\s*([}\]])/g, '$1')
  return text
}

export const parseCRMCustomQuery = (rawQuery: string): Record<string, unknown> | undefined => {
  const trimmedQuery = normalizeCRMCustomQueryText(rawQuery)
  if (!trimmedQuery) return undefined

  const parseCandidates = [trimmedQuery]
  if (!trimmedQuery.startsWith('{')) {
    parseCandidates.push(`{${trimmedQuery}}`)
  }

  for (const candidate of parseCandidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue

      const asRecord = parsed as Record<string, unknown>
      const hasQueryContainer = asRecord.query && typeof asRecord.query === 'object'
      if (hasQueryContainer) return asRecord

      return { query: asRecord }
    } catch {
      // try next candidate
    }
  }

  return undefined
}

/** Uses global Optima CRM setting when the query omits similar_commercials. */
export const withSimilarCommercialsDefault = (
  query: Record<string, unknown>,
): Record<string, unknown> => {
  if ('similar_commercials' in query) return query
  return { ...query, ...getSimilarCommercialsQuery() }
}

export const withCRMCoordinateQueryFields = (
  query: Record<string, unknown>,
): Record<string, unknown> => ({
  ...query,
  // as for now not need to pass the latitude and longitude query fields so i have comment it out
})

/** Parses admin sort JSON (e.g. `{"created_at": -1}` or `{"updated_at": true}`). */
export const parseCRMSortParams = (raw: string): Record<string, unknown> | undefined => {
  const trimmed = normalizeCRMCustomQueryText(raw)
  if (!trimmed) return undefined

  const candidates = [trimmed]
  if (!trimmed.startsWith('{')) {
    candidates.push(`{${trimmed}}`)
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue
      return parsed as Record<string, unknown>
    } catch {
      // try next candidate
    }
  }

  return undefined
}

const mergeCRMListingOptions = (
  base: Record<string, unknown>,
  sortParams?: Record<string, unknown>,
): Record<string, unknown> => {
  if (!sortParams || !Object.keys(sortParams).length) return base

  return {
    ...base,
    sort: sortParams,
  }
}

const hasCRMPropertyIdentity = (record: Record<string, unknown>): boolean =>
  record._id != null || record.reference != null

/** Optima property listings prepend `{ pagination: { total } }` as the first array item. */
const isCRMPaginationMetaRow = (record: Record<string, unknown>): boolean =>
  record.pagination != null &&
  typeof record.pagination === 'object' &&
  !hasCRMPropertyIdentity(record)

const isCRMListRow = (item: unknown): item is Record<string, unknown> =>
  !!item && typeof item === 'object' && !isCRMPaginationMetaRow(item as Record<string, unknown>)

export const extractCRMList = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isCRMListRow)
  }

  if (payload && typeof payload === 'object') {
    const asRecord = payload as Record<string, unknown>
    const knownCollections = [
      'data',
      'docs',
      'results',
      'items',
      'commercial_properties',
      'properties',
      'constructions',
    ]

    for (const key of knownCollections) {
      const value = asRecord[key]
      if (Array.isArray(value)) {
        return value.filter(isCRMListRow)
      }
    }
  }

  return []
}

export const extractCRMTotal = (payload: unknown, fallback: number): number => {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (!item || typeof item !== 'object') continue
      const record = item as Record<string, unknown>

      const paginationTotal = pickNumber(
        (record.pagination as Record<string, unknown> | undefined)?.total,
      )
      if (paginationTotal !== undefined && paginationTotal >= 0) return paginationTotal

      const totalProperties = pickNumber(record.total_properties)
      if (totalProperties !== undefined && totalProperties >= 0) return totalProperties
    }

    return fallback
  }

  if (!payload || typeof payload !== 'object') return fallback

  const asRecord = payload as Record<string, unknown>
  const candidates = [
    asRecord.total,
    asRecord.totalDocs,
    asRecord.totalCount,
    asRecord.count,
    (asRecord.meta as Record<string, unknown> | undefined)?.total,
    (asRecord.pagination as Record<string, unknown> | undefined)?.total,
  ]

  for (const candidate of candidates) {
    const n = pickNumber(candidate)
    if (n !== undefined && n >= 0) return n
  }

  return fallback
}

/**
 * Optima detail/view responses wrap the record as `{ property, attachments, ... }`.
 * Listing items are usually flat. Unwrap so downstream code reads `description`, `title`, etc.
 */
export const unwrapCRMPropertyRecord = (
  record: Record<string, unknown>,
): Record<string, unknown> => {
  const nested = record.property
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) return record

  const inner = nested as Record<string, unknown>
  if (!hasCRMPropertyIdentity(inner) || hasCRMPropertyIdentity(record)) return record

  const unwrapped: Record<string, unknown> = { ...inner }

  const topAttachments = record.attachments ?? record.property_attachments
  if (Array.isArray(topAttachments) && topAttachments.length > 0) {
    const existing = Array.isArray(unwrapped.property_attachments)
      ? unwrapped.property_attachments
      : []
    if (existing.length === 0) {
      unwrapped.property_attachments = topAttachments
    }
  }

  if (record.featured !== undefined && unwrapped.featured === undefined) {
    unwrapped.featured = record.featured
  }

  if (Array.isArray(record.bookings) && !Array.isArray(unwrapped.bookings)) {
    unwrapped.bookings = record.bookings
  }

  return unwrapped
}

const parsePriceBound = (value?: string): string | undefined => {
  if (!value || value === 'any') return undefined
  const digits = value.replace(/[^\d]/g, '')
  return digits || undefined
}

/**
 * Merge CRM query objects. Simple fields (sale, status, location, …) stay at the top level.
 * `$and` / `$or` / `$nor` are preserved as `$and` entries so status filters match live CRM:
 * `{ sale: true, $and: [{ $or: [ …resale… ] }] }` — not a top-level `$or`.
 */
export const mergeCRMQueryObjects = (
  ...sources: Record<string, unknown>[]
): Record<string, unknown> => {
  const merged: Record<string, unknown> = {}
  const andItems: Record<string, unknown>[] = []

  const appendAndItems = (items: unknown) => {
    if (!Array.isArray(items)) return
    for (const item of items) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        andItems.push(item as Record<string, unknown>)
      }
    }
  }

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue

    for (const [key, value] of Object.entries(source)) {
      if (key === '$and') {
        appendAndItems(value)
        continue
      }

      if (key === '$or') {
        andItems.push({ $or: value })
        continue
      }

      if (key === '$nor') {
        andItems.push({ $nor: value })
        continue
      }

      merged[key] = value
    }
  }

  if (andItems.length > 0) {
    merged.$and = andItems
  }

  return merged
}

const buildSinglePropertyListingStatusQuery = (status: string): Record<string, unknown> | null => {
  if (status === 'project') {
    return {
      $or: [{ project: true }, { 'categories.new_construction': true }],
    }
  }

  if (status === 'resale') {
    return {
      project: false,
    }
  }

  return null
}

const formatCRMDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfToday = (): Date => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const addMonthsToDate = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export const buildYearBuiltDeliveryQuery = (lteDate: string): Record<string, unknown> => ({
  year_built: {
    $exists: true,
    $nin: ['', null],
    $lte: lteDate,
  },
})

/** Delivery / handover filter — `year_built.$lte` is computed from today + option months. */
export const buildPropertyListingDeliveryQuery = (
  deliveryDate?: string,
): Record<string, unknown> | null => {
  const value = deliveryDate?.trim()
  if (!value || value === 'any') return null

  const today = startOfToday()
  let lteDate: string | null = null

  switch (value) {
    case '1':
      lteDate = formatCRMDate(today)
      break
    case '3':
      lteDate = formatCRMDate(addMonthsToDate(today, 3))
      break
    case '6':
      lteDate = formatCRMDate(addMonthsToDate(today, 6))
      break
    case '12':
      lteDate = formatCRMDate(addMonthsToDate(today, 12))
      break
    case '18':
      lteDate = formatCRMDate(addMonthsToDate(today, 18))
      break
    case '60':
      lteDate = formatCRMDate(addMonthsToDate(today, -18))
      break
    default:
      return null
  }

  return buildYearBuiltDeliveryQuery(lteDate)
}

/** `1000000` = indifferent (no distance filter). */
export const PROPERTY_LISTING_DISTANCE_INDIFFERENT = '1000000'

/**
 * Distance to sea — CRM matches km or meters:
 * `$and: [{ $or: [{ distances.sea.value/$lte + unit km }, { … unit meters }] }]`
 */
export const buildPropertyListingDistanceQuery = (
  distanceToSea?: string,
): Record<string, unknown> | null => {
  const value = distanceToSea?.trim()
  if (!value || value === 'any' || value === PROPERTY_LISTING_DISTANCE_INDIFFERENT) {
    return null
  }

  const meters = parseInt(value.replace(/\D/g, ''), 10)
  if (!Number.isFinite(meters) || meters <= 0) return null

  const km = meters / 1000

  return {
    $or: [
      {
        'distances.sea.value': { $lte: km },
        'distances.sea.unit': 'km',
      },
      {
        'distances.sea.value': { $lte: String(meters) },
        'distances.sea.unit': 'meters',
      },
    ],
  }
}

export const PROPERTY_LISTING_STATUS_VALUES = ['project', 'resale'] as const

export const PROPERTY_LISTING_FEATURE_VALUES = ['sea views', 'mountain', 'golf'] as const

const FEATURE_TO_VIEW_PARAM: Record<string, string> = {
  'sea views': 'sea',
  mountain: 'mountain',
  golf: 'golf',
}

const buildFeatureViewsParam = (features?: string | string[]): string[] | undefined => {
  const values = Array.from(
    new Set(
      (Array.isArray(features)
        ? features.filter((item) => item && item !== 'any')
        : features && features !== 'any'
          ? [features]
          : []
      ).filter((item) => (PROPERTY_LISTING_FEATURE_VALUES as readonly string[]).includes(item)),
    ),
  )

  if (values.length === 0) return undefined

  const views = values
    .map((value) => FEATURE_TO_VIEW_PARAM[value])
    .filter((value): value is string => Boolean(value))

  return views.length > 0 ? views : undefined
}

/** New development / resale filters for the property list Status field (multi-select). */
export const buildPropertyListingStatusQuery = (
  status?: string | string[],
): Record<string, unknown> | null => {
  const values = Array.from(
    new Set(
      (Array.isArray(status)
        ? status.filter((item) => item && item !== 'any')
        : status && status !== 'any'
          ? [status]
          : []
      ).filter((item) => (PROPERTY_LISTING_STATUS_VALUES as readonly string[]).includes(item)),
    ),
  )

  // Both selected = same as none selected (do not send status constraints)
  if (values.length >= PROPERTY_LISTING_STATUS_VALUES.length) return null

  const clauses = values
    .map((value) => buildSinglePropertyListingStatusQuery(value))
    .filter((clause): clause is Record<string, unknown> => clause !== null)

  if (clauses.length === 0) return null
  return clauses[0]
}

export type BuildFilterQueryOptions = {
  /** Map polygon refs use find-all POST (`reference: { $in }`); omit from GET listing queries */
  includeMapReferences?: boolean
}

/** Escape user input for Mongo `$regex` (literal substring match). */
const escapeRegexLiteral = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Property reference search for commercial_properties POST:
 * - numeric term → exact `reference` (number) OR regex on external/other_reference
 * - non-numeric → only regex on external_reference + other_reference
 */
export const buildPropertyReferenceSearchOr = (
  searchTerm: string,
): Record<string, unknown>[] | null => {
  const trimmed = searchTerm.trim()
  if (!trimmed) return null

  const escaped = escapeRegexLiteral(trimmed)
  const regexClause = { $regex: `.*${escaped}.*`, $options: 'i' }
  const orClauses: Record<string, unknown>[] = []

  if (/^\d+$/.test(trimmed)) {
    const numericRef = Number(trimmed)
    if (Number.isFinite(numericRef)) {
      orClauses.push({ reference: numericRef })
    }
  }

  orClauses.push({ external_reference: regexClause })
  orClauses.push({ other_reference: regexClause })

  return orClauses
}

export const buildFilterQuery = (
  filters: PropertyListFilters,
  options: BuildFilterQueryOptions = {},
): Record<string, unknown> => {
  const { includeMapReferences = false } = options
  const query: Record<string, unknown> = {}
  const andClauses: Record<string, unknown>[] = []

  if (includeMapReferences && filters.mapReferences?.length) {
    const refs = [...new Set(filters.mapReferences.map((ref) => ref.trim()).filter(Boolean))]
    const numericRefs = refs.map((ref) => Number(ref)).filter((value) => Number.isFinite(value))
    const stringRefs = refs.filter((ref) => !Number.isFinite(Number(ref)))

    const orClauses: Record<string, unknown>[] = []
    if (numericRefs.length) orClauses.push({ reference: { $in: numericRefs } })
    if (stringRefs.length) orClauses.push({ reference: { $in: stringRefs } })

    if (orClauses.length === 1) {
      Object.assign(query, orClauses[0])
    } else if (orClauses.length > 1) {
      andClauses.push({ $or: orClauses })
    }
  } else if (filters.reference?.trim()) {
    const referenceOr = buildPropertyReferenceSearchOr(filters.reference)
    if (referenceOr?.length) {
      andClauses.push({ $or: referenceOr })
    }
  }

  if (filters.propertyType?.length) {
    const typeKeys = filters.propertyType
      .map((value) => Number(value))
      .filter((key) => Number.isFinite(key))

    if (typeKeys.length > 0) {
      query.type_one = { $in: typeKeys }
    }
  }

  const countryKeys = (filters.country ?? [])
    .map((value) => Number(value))
    .filter((key) => Number.isFinite(key))
    .slice(0, 1)

  if (countryKeys.length > 0) {
    query.country = { $in: countryKeys }
  }

  // Match gestali-home CommercialPropertiesNew::setQuery — coast uses lg_by_key, not location_group.
  const coastKeys = (filters.coast ?? [])
    .map((value) => Number(value))
    .filter((key) => Number.isFinite(key))

  if (coastKeys.length > 0) {
    query.lg_by_key = { $in: coastKeys }
  }

  const cityKeys = (filters.city ?? [])
    .map((value) => Number(value))
    .filter((key) => Number.isFinite(key))

  if (cityKeys.length > 0) {
    query.city = { $in: cityKeys }
  }

  const views = buildFeatureViewsParam(filters.features)
  if (views) query.views = views

  if (andClauses.length > 0) {
    query.$and = andClauses
  }

  const minPrice = parsePriceBound(filters.minPrice)
  const maxPrice = parsePriceBound(filters.maxPrice)
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceMin = minPrice !== undefined ? Number(minPrice) : 0
    const priceMax = maxPrice !== undefined ? Number(maxPrice) : 999_999_999
    query.current_price = { $gte: priceMin, $lte: priceMax }
  }

  const bedroomCount = parseCountFilterValue(filters.bedrooms, filters.bedroomsCustom)
  if (bedroomCount !== undefined) {
    query.bedrooms = bedroomCount
  }

  const bathroomCount = parseCountFilterValue(filters.bathrooms, filters.bathroomsCustom)
  if (bathroomCount !== undefined) {
    query.bathrooms = bathroomCount
  }

  const hasCompleteStayPeriod = Boolean(filters.periodFrom?.trim() && filters.periodTo?.trim())

  if (filters.periodFrom?.trim()) {
    const arrivalTs = arrivalDateKeyToUnixSeconds(filters.periodFrom.trim())
    if (arrivalTs != null) query.rental_period_from = arrivalTs
  }

  if (filters.periodTo?.trim()) {
    const departureTs = departureDateKeyToUnixSeconds(filters.periodTo.trim())
    if (departureTs != null) query.rental_period_to = departureTs
  }

  if (hasCompleteStayPeriod) {
    query.booking_search = 1
  }

  const guestCount = resolveHolidayGuestsFilterCount(filters.guests, filters.guestsCustom)
  if (guestCount != null) {
    query.sleeps = { $exists: true, $gte: guestCount }
  }

  const holidayBudget = resolveHolidayBudgetRange(filters.totalBudget)
  if (holidayBudget) {
    if (hasCompleteStayPeriod) {
      // Stay + budget: filter by calculated rental total for the selected dates.
      query.rental_new_price = `${holidayBudget[0]}, ${holidayBudget[1]}`
    } else {
      // Budget only: filter against seasonal price bands (no stay dates).
      query.period_seasons_price = true
      query.period_seasons_price_from = holidayBudget[0]
      query.period_seasons_price_to = holidayBudget[1]
    }
  }

  return query
}

/** CRM pagination — matches PHP: options.page + options.limit */
export const buildCRMPageOptions = (page: number, limit: number): Record<string, number> => ({
  page: Math.max(1, page),
  limit: Math.max(1, limit),
})

/** POST commercial_properties — populate published image attachments only. */
export const CRM_PROPERTY_ATTACHMENTS_POPULATE = [
  {
    path: 'property_attachments',
    match: {
      document: { $ne: true },
      publish_status: { $ne: false },
    },
  },
] as const

/** Ensures POST listing bodies include attachment populate in options. */
export const withCRMPostListingOptions = (
  body: Record<string, unknown>,
): Record<string, unknown> => {
  const options =
    body.options && typeof body.options === 'object'
      ? { ...(body.options as Record<string, unknown>) }
      : {}

  if (!Array.isArray(options.populate) || options.populate.length === 0) {
    options.populate = [...CRM_PROPERTY_ATTACHMENTS_POPULATE]
  }

  return { ...body, options }
}

/** Restrict listing to favorited property IDs (supports CRM `_id` and numeric `id`). */
export const buildFavoriteIdsClause = (
  ids: (string | number)[],
): Record<string, unknown> | null => {
  if (!ids.length) return null

  const stringIds = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))]
  const numericIds = [
    ...new Set(
      ids.map((id) => (typeof id === 'number' ? id : Number(id))).filter((n) => Number.isFinite(n)),
    ),
  ]

  const orClauses: Record<string, unknown>[] = []
  if (stringIds.length) orClauses.push({ _id: { $in: stringIds } })
  if (numericIds.length) orClauses.push({ id: { $in: numericIds } })

  if (!orClauses.length) return null
  if (orClauses.length === 1) return orClauses[0]
  return { $or: orClauses }
}

export const buildCRMListingQuery = ({
  preset,
  crmQueryJson,
  crmCity,
  page,
  pageSize,
  filters = {},
  restrictToFavoriteIds,
  sortParams,
}: {
  preset: CRMListingPreset
  crmQueryJson?: string | null
  /** City CRM key — used when preset is `cityWise`. */
  crmCity?: number | string | null
  page: number
  pageSize: number
  filters?: PropertyListFilters
  restrictToFavoriteIds?: (string | number)[]
  sortParams?: Record<string, unknown>
}): Record<string, unknown> => {
  const similarCommercials = getSimilarCommercialsQuery()
  const paginationOptions = buildCRMPageOptions(page, pageSize)
  const hasMapRefs = Boolean(filters.mapReferences?.length)
  const filterQuery = buildFilterQuery(filters, {
    includeMapReferences: hasMapRefs,
  })

  if (preset === 'custom' && typeof crmQueryJson === 'string' && crmQueryJson.trim()) {
    const parsedQuery = parseCRMCustomQuery(crmQueryJson)
    if (parsedQuery) {
      const parsedOptions =
        parsedQuery.options && typeof parsedQuery.options === 'object'
          ? (parsedQuery.options as Record<string, unknown>)
          : {}
      const baseQuery =
        parsedQuery.query && typeof parsedQuery.query === 'object'
          ? (parsedQuery.query as Record<string, unknown>)
          : {}

      const mergedQuery = withSimilarCommercialsDefault(
        mergeCRMQueryObjects({ remove_count: true }, baseQuery, filterQuery),
      )

      const restOptions = { ...parsedOptions }
      delete restOptions.skip

      return {
        ...parsedQuery,
        options: mergeCRMListingOptions(
          {
            ...restOptions,
            ...paginationOptions,
          },
          sortParams,
        ),
        query: mergedQuery,
      }
    }

    console.error(
      'Invalid CRM custom query JSON on property list. Use valid JSON (e.g. {"$ne": true} not {$ne: true}).',
      crmQueryJson,
    )
    return {
      options: mergeCRMListingOptions(paginationOptions, sortParams),
      query: withSimilarCommercialsDefault({ remove_count: true }),
    }
  }


  const DEFAULT_QUERY = {
    remove_count: true,
    archived: { $ne: true },
  } as const


  let defaultSort: Record<string, unknown> | undefined
  let baseQuery: Record<string, unknown> = {
    ...similarCommercials,
    ...DEFAULT_QUERY,
    // has_images: true,
    // coordinates query fields
    status: { $in: ['Available', 'Under Offer'] },
  }

  if (preset === 'sold') {
    baseQuery = {
      ...similarCommercials,
      sale: true,
      ...DEFAULT_QUERY,
      // has_images: true,
      status: { $in: ['Sold'] },
    }
  } else if (preset === 'forSale') {
    baseQuery = {
      ...similarCommercials,
      ...DEFAULT_QUERY,
      sale: true,
      // has_images: true,
      // coordinates query fields
      status: { $in: ['Available', 'Under Offer'] },
    }
  } else if (preset === 'cityWise') {
    const cityId = Number(crmCity)
    baseQuery = {
      ...similarCommercials,
      ...DEFAULT_QUERY,
      sale: true,
      status: { $in: ['Available', 'Under Offer'] },
      ...(Number.isFinite(cityId) ? { city: { $in: [cityId] } } : {}),
    }
  } else if (preset === 'forRent') {
    baseQuery = {
      ...similarCommercials,
      rent: true,
      lt_rental: true,
      ...DEFAULT_QUERY,
      // has_images: true,
      status: { $in: ['Available', 'Under Offer'] },
    }
  } else if (preset === 'forHoliday') {
    baseQuery = {
      ...similarCommercials,
      rent: true,
      st_rental: true,
      ...DEFAULT_QUERY,
      // has_images: true,
      status: { $in: ['Available', 'Under Offer'] },
    }
  } else if (preset === 'seaView') {
    baseQuery = {
      ...similarCommercials,
      sale: true,
      ...DEFAULT_QUERY,
      // has_images: true,
      // coordinates query fields
      status: { $in: ['Available', 'Under Offer'] },
      $and: [
        {
          'views.sea': true,
        },
      ],
    }
  } else if (preset === 'beachSide') {
    baseQuery = {
      ...similarCommercials,
      sale: true,
      ...DEFAULT_QUERY,
      // has_images: true,
      // coordinates query fields
      status: { $in: ['Available', 'Under Offer'] },
      $and: [
        {
          'views.beach': true,
        },
      ],
    }
  } else if (preset === 'luxury') {
    baseQuery = {
      ...similarCommercials,
      sale: true,
      ...DEFAULT_QUERY,
      // has_images: true,
      // coordinates query fields
      status: { $in: ['Available', 'Under Offer'] },
    }
  } else if (preset === 'newDevelopments') {
    baseQuery = {
      ...similarCommercials,
      sale: true,
      ...DEFAULT_QUERY,
      // has_images: true,
      // coordinates query fields
      status: { $in: ['Available', 'Under Offer'] },
      project: true,
    }
  } else if (preset === 'newListings') {
    baseQuery = {
      ...similarCommercials,
      sale: true,
      ...DEFAULT_QUERY,
      // has_images: true,
      // coordinates query fields
      status: { $in: ['Available', 'Under Offer'] },
    }
  } else if (preset === 'golf') {
    baseQuery = {
      ...similarCommercials,
      sale: true,
      ...DEFAULT_QUERY,
      // has_images: true,
      status: { $in: ['Available', 'Under Offer'] },
      $and: [
        {
          $or: [
            { 'categories.golf': true },
            { 'settings.close_to_golf': true },
            { 'settings.frontline_golf': true },
            { 'views.golf': true },
          ],
        },
      ],
    }
  } else if (preset === 'featured') {
    baseQuery = {
      // Featured carousel always includes similar commercials, regardless of Optima CRM global.
      similar_commercials: 'include_similar',
      featured: true,
      sale: true,
      ...DEFAULT_QUERY,
      // has_images: true,
      status: { $in: ['Available', 'Under Offer'] },
    }
  } else if (preset === 'resaleHomes') {
    baseQuery = {
      ...similarCommercials,
      project: false,
      status: { $in: ['Available', 'Under Offer'] },
      sale: true,
      ...DEFAULT_QUERY,
       // has_images: true,
    }
  } else if (preset === 'favorites') {
    // Favorites fetch by explicit _id $in — do not send similar_commercials.
    baseQuery = {
      // ...similarCommercials,
      remove_count: true,
      // has_images: true,
    }
  }
  let mergedQuery = mergeCRMQueryObjects(baseQuery, filterQuery)

  if (preset === 'favorites' && restrictToFavoriteIds?.length) {
    const favoriteClause = buildFavoriteIdsClause(restrictToFavoriteIds)
    if (favoriteClause) {
      mergedQuery = mergeCRMQueryObjects(mergedQuery, favoriteClause)
    }
  }

  return {
    options: mergeCRMListingOptions(
      defaultSort ? { ...paginationOptions, sort: defaultSort } : paginationOptions,
      sortParams,
    ),
    query: mergedQuery,
  }
}

export type NormalizeCRMPropertyOptions = {
  /** Formats price as "399,000 €" instead of "€399,000" */
  currencySymbolAfter?: boolean
  /** When true, leaves price empty if CRM has no price (Properties carousel). */
  emptyPriceWhenMissing?: boolean
  /** Optima resize segment in attachment URLs (cards: 500, detail: 1000). */
  attachmentImageSize?: number
  /** Optional cap on gallery URLs for list/card views (detail pages omit this). */
  maxGalleryImages?: number
  /** Sale vs rent URL map — defaults from CRM `sale` / `rent` flags. */
  listingMode?: PropertyListingMode
  /** When true, use `/project-details` hrefs and phase price ranges (projects list only). */
  projectListing?: boolean
  /** Holiday rental listing — hide sale price until dates are selected. */
  holidayListing?: boolean
  holidayPeriodFrom?: string
  holidayPeriodTo?: string
  holidayGuests?: string
  /** Listing cards and detail pages both use "€X /night". */
  holidayPriceVariant?: 'listing' | 'detail'
}

export const resolveListingModeFromPreset = (preset: CRMListingPreset): PropertyListingMode =>
  preset === 'forRent' || preset === 'forHoliday' ? 'rent' : 'sale'

export type NormalizedCRMProperty = NormalizedListProperty & {
  description?: string
  city?: string
  region?: string
  propertySubtype?: string
  holidayPriceSummary?: string
}

export function normalizeCRMProperty(
  property: Record<string, unknown>,
  locale: string,
  options: NormalizeCRMPropertyOptions = {},
): NormalizedCRMProperty {
  property = unwrapCRMPropertyRecord(property)

  const propertyAttachments =
    Array.isArray(property.property_attachments) && property.property_attachments.length > 0
      ? property.property_attachments
      : Array.isArray(property.attachments) && property.attachments.length > 0
        ? property.attachments
        : []

  const images = Array.isArray(property.images) ? property.images : []

  const imageSize = options.attachmentImageSize ?? PROPERTY_DETAIL_IMAGE_SIZE
  const attachmentImageUrls = getPublishedPropertyAttachmentImages(propertyAttachments, imageSize)

  const legacyImageUrls = images
    .filter((image): image is Record<string, unknown> => !!image && typeof image === 'object')
    .map(
      (image) =>
        pickString(image.url) ||
        pickString(image.full) ||
        pickString(image.large) ||
        pickString(image.medium) ||
        pickString(image.small),
    )
    .filter((url) => Boolean(url))

  const fallbackImageUrl = pickString(property.main_image) || pickString(property.image)

  let imageUrls =
    attachmentImageUrls.length > 0
      ? attachmentImageUrls
      : legacyImageUrls.length > 0
        ? legacyImageUrls
        : fallbackImageUrl
          ? [fallbackImageUrl]
          : []

  if (options.maxGalleryImages && options.maxGalleryImages > 0) {
    imageUrls = imageUrls.slice(0, options.maxGalleryImages)
  }

  const imageUrl =
    imageUrls[0] ||
    getPublishedPropertyAttachmentImage(propertyAttachments, imageSize) ||
    legacyImageUrls[0] ||
    fallbackImageUrl
  const localized = resolveCRMPropertyLocalizedTexts(property, locale)

  // Prefer CRM `property_name` for cards/listings (matches search_by_property_name).
  const propertyName =
    getCRMLocalizedText(property.property_name, locale) || pickString(property.property_name)

  const propertyTitle =
    localized.title ||
    pickString(property.project_name) ||
    pickString(property.display_name) ||
    pickString(property.name) ||
    localized.propertyType ||
    propertyName ||
    'Property'

  const beds =
    pickNumber(property.bedrooms) ??
    pickNumber(property.bedrooms_from) ??
    pickNumber(property.beds)
  const baths =
    pickNumber(property.bathrooms) ??
    pickNumber(property.bathrooms_from) ??
    pickNumber(property.baths)
  const sleeps = pickNumber(property.sleeps)
  const size =
    pickNumber(property.built) ??
    pickNumber(property.built_size_from) ??
    pickNumber(property.built_from) ??
    pickNumber(property.m2_built) ??
    pickNumber(property.covered_area) ??
    pickNumber(property.internal_area) ??
    pickNumber(property.sqft)
  const dimensions = pickString(property.dimensions, 'Metres')
  const sizeWithUnit = size
    ? `${size}${dimensions === 'Metres' ? 'm²' : 'ft²'}`
    : options.currencySymbolAfter
      ? `0${dimensions === 'Metres' ? 'm²' : 'ft²'}`
      : undefined

  const isHolidayProperty = options.holidayListing === true
  // Long-term rental price comes from an active `period_seasons` / `rental_season_data`
  // window only — never fall back to sale `current_price` (matches gestali / Optima).
  const isLongTermRentalProperty =
    options.listingMode === 'rent' &&
    !isHolidayProperty &&
    (isCRMTruthy(property.lt_rental) || isCRMTruthy(property.rent))

  const rawPrice =
    property.price ?? property.current_price ?? property.sale_price ?? property.list_price
  const hasPriceOnDemand = isPriceOnDemandEnabled(property.price_on_demand)
  const priceValue = typeof rawPrice === 'number' ? rawPrice : pickNumber(rawPrice)
  const hasPositivePrice = priceValue != null && priceValue > 0
  const formattedRawPrice = hasPositivePrice
    ? typeof rawPrice === 'number'
      ? formatPriceAmount(rawPrice)
      : pickString(rawPrice)
    : undefined

  const phaseLow =
    pickNumber(property.phase_low_price_from) ?? pickNumber(property.price_from)
  const phaseHigh =
    pickNumber(property.phase_heigh_price_from) ??
    pickNumber(property.phase_high_price_from) ??
    pickNumber(property.price_to)
  // Only route to /project-details when explicitly on the projects list — commercial rows
  // may have `project: true` or phase price fields without being a construction listing.
  const isProjectEntity = options.projectListing === true

  let resolvedPrice = options.emptyPriceWhenMissing ? '' : PRICE_ON_REQUEST_LABEL
  let holidayPriceSummary: string | undefined
  let holidayPriceValue: number | undefined

  if (isHolidayProperty) {
    // ST rental: active `rental_seasons` nightly rate, else "Price on demand"
    const holidayPrice = resolveHolidayPriceDisplay({
      property,
      periodFrom: options.holidayPeriodFrom,
      periodTo: options.holidayPeriodTo,
      guests: options.holidayGuests,
      variant: options.holidayPriceVariant ?? 'listing',
    })
    resolvedPrice = holidayPrice.label
    holidayPriceSummary = holidayPrice.summary
    holidayPriceValue = holidayPrice.nightlyRate ?? holidayPrice.quote?.dailyPrice ?? undefined
  } else if (isProjectEntity && (phaseLow != null || phaseHigh != null)) {
    const low = phaseLow != null && phaseLow > 0 ? phaseLow : undefined
    const high = phaseHigh != null && phaseHigh > 0 ? phaseHigh : undefined
    if (low != null && high != null && high !== low) {
      const lowLabel = formatPriceAmount(low)
      const highLabel = formatPriceAmount(high)
      resolvedPrice = options.currencySymbolAfter
        ? `${lowLabel} – ${highLabel} €`
        : `€${lowLabel} – €${highLabel}`
    } else if (low != null) {
      const lowLabel = formatPriceAmount(low)
      resolvedPrice = options.currencySymbolAfter ? `${lowLabel} €` : `€${lowLabel}`
    } else if (high != null) {
      const highLabel = formatPriceAmount(high)
      resolvedPrice = options.currencySymbolAfter ? `${highLabel} €` : `€${highLabel}`
    } else if (hasPriceOnDemand) {
      resolvedPrice = PRICE_ON_DEMAND_LABEL
    }
  } else if (isLongTermRentalProperty) {
    // LT rental: default on demand; only update when today is inside a season window
    resolvedPrice = PRICE_ON_DEMAND_LABEL
    const activeSeason = pickActiveLongTermRentalSeason(property)
    if (activeSeason) {
      const seasonPrice =
        pickNumber(activeSeason.new_price) ??
        pickNumber(activeSeason.total_per_month) ??
        pickNumber(activeSeason.price)
      const duration = activeSeason.duration === 'per_month' ? 'month' : 'year'
      if (seasonPrice != null && seasonPrice > 0) {
        const formatted = formatPriceAmount(seasonPrice)
        resolvedPrice = options.currencySymbolAfter
          ? `${formatted} € per ${duration}`
          : `€${formatted} per ${duration}`
      }
    }
  } else if (hasPriceOnDemand) {
    resolvedPrice = PRICE_ON_DEMAND_LABEL
  } else if (formattedRawPrice) {
    resolvedPrice = options.currencySymbolAfter ? `${formattedRawPrice} €` : `€${formattedRawPrice}`
  } else if (priceValue === 0) {
    // CRM often uses 0 for "no price" — hide instead of showing €0
    resolvedPrice = ''
  }

  const referenceRaw = property.reference
  const reference =
    typeof referenceRaw === 'number' ? String(referenceRaw) : pickString(referenceRaw)
  const displayReference =
    resolvePropertyDisplayReference(
      property,
      resolveOptimaCrmSettings().propertyReferenceField,
    ) || reference
  // in get method i get the  "sale": true, need to show the badge for Sale
  const statusBadgeLabel = resolveCRMStatusBadgeLabel(property.status)
  const crmStatus = pickString(property.status) || undefined
  const id = pickString(property._id) || pickString(property.id)

  let detailHref = isProjectEntity
    ? resolveProjectDetailHref(property, locale)
    : resolvePropertyDetailHref(property, locale, {
        listingMode: options.listingMode ?? resolvePropertyListingMode(property),
      })

  return {
    id,
    imageUrl,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    isNewListing: Boolean(property.featured),
    statusBadgeLabel,
    crmStatus,
    location: localized.location || pickString(property.city_name) || 'Greece',
    city: localized.city || pickString(property.city_name) || undefined,
    region: localized.region || undefined,
    reference,
    displayReference,
    detailHref,
    title: propertyTitle,
    description: localized.description || undefined,
    propertyType: localized.propertyType || undefined,
    propertySubtype: localized.propertySubtype || undefined,
    beds,
    baths,
    sleeps: sleeps != null && sleeps > 0 ? sleeps : undefined,
    sqft: sizeWithUnit,
    price: resolvedPrice,
    priceValue: isHolidayProperty
      ? holidayPriceValue
      : isProjectEntity
        ? (phaseLow ?? priceValue)
        : priceValue,
    holidayPriceSummary,
    createdAt: pickString(property.created_at) || pickString(property.createdAt),
  }
}

export { HOLIDAY_SELECT_DATES_LABEL, PRICE_ON_DEMAND_LABEL, PRICE_ON_REQUEST_LABEL }

export const normalizeCRMListProperty = (
  property: Record<string, unknown>,
  locale: string,
  options: NormalizeCRMPropertyOptions = {},
): NormalizedListProperty =>
  normalizeCRMProperty(property, locale, {
    attachmentImageSize: PROPERTY_CARD_IMAGE_SIZE,
    ...options,
  })

export const sortProperties = (
  properties: NormalizedListProperty[],
  sort: PropertyListSort,
): NormalizedListProperty[] => {
  const copy = [...properties]

  if (sort === 'priceDesc') {
    return copy.sort((a, b) => (b.priceValue ?? 0) - (a.priceValue ?? 0))
  }
  if (sort === 'priceAsc') {
    return copy.sort((a, b) => (a.priceValue ?? 0) - (b.priceValue ?? 0))
  }

  return copy.sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0
    return bTime - aTime
  })
}

/** `auto` = POST only when GET cannot express the query (map refs, favorites). */
export type CRMPropertiesListMethod = 'get' | 'post' | 'auto'

/**
 * Override property list HTTP method via env:
 * - `NEXT_PUBLIC_CRM_PROPERTIES_LIST_METHOD` — client + server (recommended)
 * - `CRM_PROPERTIES_LIST_METHOD` — server-only fallback
 */
export function resolveCRMPropertiesListMethod(): CRMPropertiesListMethod {
  const raw = (
    process.env.NEXT_PUBLIC_CRM_PROPERTIES_LIST_METHOD ??
    process.env.CRM_PROPERTIES_LIST_METHOD ??
    ''
  )
    .trim()
    .toLowerCase()

  if (raw === 'get' || raw === 'post') return raw
  return 'auto'
}

/**
 * POST commercial_properties — required when GET cannot express multi-value filters
 * (map polygon `reference: { $in }`, favorites `_id: { $in }`, reference `$or` / `$regex`).
 */
export function needsCRMPropertiesPost({
  filters,
  preset,
  favoriteIds,
}: {
  filters?: PropertyListFilters
  preset?: CRMListingPreset
  favoriteIds?: (string | number)[]
}): boolean {
  if (filters?.mapReferences?.length) return true
  if (filters?.reference?.trim()) return true
  if (preset === 'favorites' && favoriteIds?.length) return true
  if (preset === 'custom') return true
  return false
}

export function shouldUseCRMPropertiesPost({
  filters,
  preset,
  favoriteIds,
}: {
  filters?: PropertyListFilters
  preset?: CRMListingPreset
  favoriteIds?: (string | number)[]
}): boolean {
  const method = resolveCRMPropertiesListMethod()
  if (method === 'post') return true
  if (method === 'get') return false
  return needsCRMPropertiesPost({ filters, preset, favoriteIds })
}

/** GET /properties through the MODE-selected NestJS base. */
export async function fetchCRMProperties({
  body,
  signal,
}: {
  body: Record<string, unknown>
  signal?: AbortSignal
}): Promise<CRMFetchResult> {
  const searchParams = crmListingBodyToSearchParams(body)
  const response = await getFromCRM('properties', searchParams, { signal })
  if (!response.ok) {
    throw new Error(`CRM API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const list = extractCRMList(data)
  const total = extractCRMTotal(data, list.length)

  return { properties: list, total }
}

/**
 * POST commercial_properties — multi-value Mongo filters (map refs, favorite `_id`s).
 * Main branch used this for map-area and favorites listings.
 */
export async function fetchCRMPropertiesPost({
  body,
  signal,
  reason,
}: {
  body: Record<string, unknown>
  signal?: AbortSignal
  reason?: 'map-area' | 'favorites' | 'holiday' | 'reference'
}): Promise<CRMFetchResult> {
  const postBody = withCRMPostListingOptions(body)

  console.info('[CRM commercial_properties POST] request', {
    reason: reason ?? 'multi-filter',
    endpoint: 'commercial_properties',
    options: postBody.options,
    query: postBody.query,
  })

  const response = await postToCRM('commercial_properties', postBody, { signal })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    console.error('[CRM commercial_properties POST] failed', {
      reason: reason ?? 'multi-filter',
      status: response.status,
      body: errorText.slice(0, 500),
    })
    throw new Error(`CRM commercial_properties API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const list = extractCRMList(data)
  const total = extractCRMTotal(data, list.length)

  console.info('[CRM commercial_properties POST] response', {
    reason: reason ?? 'multi-filter',
    count: list.length,
    total,
    references: list
      .slice(0, 10)
      .map((item) => item.reference)
      .filter(Boolean),
    ids: list
      .slice(0, 10)
      .map((item) => item._id)
      .filter(Boolean),
    payloadKeys:
      data && typeof data === 'object' && !Array.isArray(data)
        ? Object.keys(data as Record<string, unknown>)
        : Array.isArray(data)
          ? ['array']
          : [],
  })

  return { properties: list, total }
}

/** @deprecated Use fetchCRMPropertiesPost */
export const fetchCRMMapAreaProperties = fetchCRMPropertiesPost
