import { isCRMTruthy } from '@/utilities/localizedValue'
import { isHolidayRentalProperty } from '@/utilities/crmHoliday'

export type PropertyDetailListingContext =
  | 'forSale'
  | 'forRent'
  | 'forHoliday'
  | 'forSold'
  | 'cityWise'

export const PROPERTY_DETAIL_FOR_QUERY_KEY = 'for'

const STORAGE_KEY = 'app:property-detail-listing-context'

const FOR_QUERY_TO_CONTEXT: Record<string, PropertyDetailListingContext> = {
  holiday_rental: 'forHoliday',
  holiday: 'forHoliday',
  forholiday: 'forHoliday',
  rental: 'forRent',
  rent: 'forRent',
  forrent: 'forRent',
  sales: 'forSale',
  sale: 'forSale',
  forsale: 'forSale',
  sold: 'forSold',
  forsold: 'forSold',
  city_wise: 'cityWise',
  citywise: 'cityWise',
}

type StashedPropertyDetailListingContext = {
  reference: string
  listingContext: PropertyDetailListingContext
}

const isPropertyDetailListingContext = (
  value: unknown,
): value is PropertyDetailListingContext =>
  value === 'forSale' ||
  value === 'forRent' ||
  value === 'forHoliday' ||
  value === 'forSold' ||
  value === 'cityWise'

/** Map CMS / CRM listing preset to detail-page listing context. */
export function listingPresetToDetailContext(
  preset: string | undefined,
): PropertyDetailListingContext | undefined {
  switch (preset) {
    case 'forHoliday':
      return 'forHoliday'
    case 'forRent':
      return 'forRent'
    case 'forSale':
      return 'forSale'
    case 'cityWise':
      return 'cityWise'
    case 'sold':
      return 'forSold'
    default:
      return undefined
  }
}

/**
 * Infer detail `?for=` context from CRM flags when the list preset is mixed
 * (favorites) or otherwise does not imply sale / rent / holiday.
 * Prefer `st_rental` over long-term `rent` — holiday listings often set both.
 */
export function resolveDetailListingContextFromProperty(
  property: Record<string, unknown>,
): PropertyDetailListingContext | undefined {
  if (isCRMTruthy(property.st_rental)) return 'forHoliday'
  if (isCRMTruthy(property.lt_rental) || isCRMTruthy(property.rent)) return 'forRent'
  if (isCRMTruthy(property.sale)) return 'forSale'
  return undefined
}

/** Preset context when available; otherwise infer from the property record. */
export function resolvePropertyDetailListingContext(
  preset: string | undefined,
  property: Record<string, unknown>,
): PropertyDetailListingContext | undefined {
  return listingPresetToDetailContext(preset) ?? resolveDetailListingContextFromProperty(property)
}

export function listingContextToListingMode(
  listingContext: PropertyDetailListingContext | undefined,
): 'sale' | 'rent' | undefined {
  if (listingContext === 'forHoliday' || listingContext === 'forRent') return 'rent'
  if (
    listingContext === 'forSale' ||
    listingContext === 'forSold' ||
    listingContext === 'cityWise'
  ) {
    return 'sale'
  }
  return undefined
}

/** Parse `?for=` on property detail URLs (`holiday_rental`, `rental`, `sales`, `sold`, `city_wise`). */
export function parsePropertyDetailForQuery(
  value: string | null | undefined,
): PropertyDetailListingContext | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return undefined
  return FOR_QUERY_TO_CONTEXT[normalized]
}

export function listingContextToForQueryValue(
  listingContext: PropertyDetailListingContext,
): string {
  switch (listingContext) {
    case 'forHoliday':
      return 'holiday_rental'
    case 'forRent':
      return 'rental'
    case 'forSale':
      return 'sales'
    case 'forSold':
      return 'sold'
    case 'cityWise':
      return 'city_wise'
  }
}

/** Append `?for=` to a property detail href. */
export function appendForQueryToDetailHref(
  href: string | undefined,
  listingContext?: PropertyDetailListingContext,
): string | undefined {
  if (!href || !listingContext) return href

  const forValue = listingContextToForQueryValue(listingContext)
  const [path, existingQuery = ''] = href.split('?')
  const merged = new URLSearchParams(existingQuery)
  merged.set(PROPERTY_DETAIL_FOR_QUERY_KEY, forValue)

  const qs = merged.toString()
  return qs ? `${path}?${qs}` : path
}

/** Holiday-only property (no sale / long-term rental flags). */
export function isHolidayExclusiveProperty(property: Record<string, unknown>): boolean {
  if (!isHolidayRentalProperty(property)) return false
  return (
    !isCRMTruthy(property.sale) &&
    !isCRMTruthy(property.rent) &&
    !isCRMTruthy(property.lt_rental)
  )
}

/**
 * Booking UI only when the visitor explicitly opened a holiday listing,
 * or the property is exclusively short-term rental.
 */
export function resolvePropertyDetailHolidayMode(
  listingContext: PropertyDetailListingContext | undefined,
  property: Record<string, unknown>,
  options?: { hasHolidaySearchParams?: boolean },
): boolean {
  if (!isHolidayRentalProperty(property)) return false

  if (listingContext === 'forHoliday') return true

  if (
    listingContext === 'forRent' ||
    listingContext === 'forSale' ||
    listingContext === 'forSold' ||
    listingContext === 'cityWise'
  ) {
    return false
  }

  if (options?.hasHolidaySearchParams) return true

  return isHolidayExclusiveProperty(property)
}

/** Remember listing context for the next property detail view (session fallback). */
export function stashPropertyDetailListingContext(
  reference: string,
  listingContext: PropertyDetailListingContext,
): void {
  if (typeof window === 'undefined') return

  const trimmedReference = reference.trim()
  if (!trimmedReference) return

  try {
    const payload: StashedPropertyDetailListingContext = {
      reference: trimmedReference,
      listingContext,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

/** Read and clear stashed listing context when it matches the opened property reference. */
export function takePropertyDetailListingContext(
  reference: string,
): PropertyDetailListingContext | undefined {
  if (typeof window === 'undefined') return undefined

  const trimmedReference = reference.trim()
  if (!trimmedReference) return undefined

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined

    sessionStorage.removeItem(STORAGE_KEY)

    const parsed = JSON.parse(raw) as StashedPropertyDetailListingContext
    if (parsed.reference !== trimmedReference) return undefined

    if (isPropertyDetailListingContext(parsed.listingContext)) {
      return parsed.listingContext
    }
  } catch {
    // ignore invalid storage payload
  }

  return undefined
}
