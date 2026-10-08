import {
  BATHROOM_OPTIONS,
  BEDROOM_OPTIONS,
  DELIVERY_OPTIONS,
  DISTANCE_OPTIONS,
  GUEST_OPTIONS,
  HOLIDAY_BUDGET_OPTIONS,
  MAX_PRICE_OPTIONS,
  MIN_PRICE_OPTIONS,
  PRICE_RANGE_OPTIONS,
  PROPERTY_LISTING_FEATURE_OPTIONS,
  SORT_OPTIONS,
} from '@/components/PropertyList/filterOptions'

export type FilterSelectOption = { value: string; label: string }

export type PriceRangeOption = FilterSelectOption & { min: string; max: string }

export type PropertySortOption = FilterSelectOption & {
  sort: Record<string, unknown>
}

export type PropertyFilterOptions = {
  sortOptions: PropertySortOption[]
  priceRanges: PriceRangeOption[]
  bedrooms: FilterSelectOption[]
  bathrooms: FilterSelectOption[]
  minPrices: FilterSelectOption[]
  maxPrices: FilterSelectOption[]
  features: FilterSelectOption[]
  deliveryDates: FilterSelectOption[]
  distanceToSea: FilterSelectOption[]
  guests: FilterSelectOption[]
  holidayBudgetRanges: PriceRangeOption[]
}

/** Keep ranges whose `value` is in `selectedValues`. Empty/undefined selection → all. */
export function filterRangeOptions(
  allRanges: readonly PriceRangeOption[],
  selectedValues?: readonly string[] | null,
): PriceRangeOption[] {
  if (!selectedValues?.length) return [...allRanges]
  const allowed = new Set(selectedValues.map((value) => value.trim()).filter(Boolean))
  return allRanges.filter((range) => allowed.has(range.value))
}

function formatBoundLabel(bound: string): string {
  if (!bound || bound === 'any') return bound
  const numeric = Number(bound)
  if (!Number.isFinite(numeric)) return bound
  return `€${numeric.toLocaleString('en-US')}`
}

/** Build Min price dropdown options from price ranges. Always includes `any`. */
export function deriveMinPriceOptions(
  ranges: readonly PriceRangeOption[],
  anyLabel = 'Any Min Price',
): FilterSelectOption[] {
  const options: FilterSelectOption[] = [{ value: 'any', label: anyLabel }]
  const seen = new Set<string>(['any'])

  for (const range of ranges) {
    const value = range.min?.trim() || 'any'
    if (seen.has(value) || value === 'any') continue
    seen.add(value)
    options.push({ value, label: formatBoundLabel(value) })
  }

  return options
}

/** Build Max price dropdown options from price ranges. Always includes `any`. */
export function deriveMaxPriceOptions(
  ranges: readonly PriceRangeOption[],
  anyLabel = 'Any Max Price',
): FilterSelectOption[] {
  const options: FilterSelectOption[] = [{ value: 'any', label: anyLabel }]
  const seen = new Set<string>(['any'])

  for (const range of ranges) {
    const value = range.max?.trim() || 'any'
    if (seen.has(value) || value === 'any') continue
    seen.add(value)
    options.push({ value, label: formatBoundLabel(value) })
  }

  return options
}

/**
 * Resolve a country's selected range keys for the current filter context.
 * Returns undefined when no country is selected (callers treat that as “all ranges”).
 */
export function resolveCountrySelectedRangeValues(
  countries: ReadonlyArray<{
    value: string
    priceRangeValues?: string[]
    holidayBudgetValues?: string[]
  }>,
  countryKeys: readonly string[] | null | undefined,
  kind: 'price' | 'holiday',
): string[] | undefined {
  const countryKey = countryKeys?.find((key) => key && key !== 'any' && key !== 'all')
  if (!countryKey) return undefined
  const country = countries.find((item) => item.value === countryKey)
  if (!country) return undefined
  const values = kind === 'holiday' ? country.holidayBudgetValues : country.priceRangeValues
  return values?.length ? values : undefined
}

const defaultPriceRanges = PRICE_RANGE_OPTIONS.map((opt) => ({ ...opt }))

export const DEFAULT_PROPERTY_FILTER_OPTIONS: PropertyFilterOptions = {
  sortOptions: SORT_OPTIONS.map((opt) => ({ ...opt, sort: { ...opt.sort } })),
  priceRanges: defaultPriceRanges,
  bedrooms: BEDROOM_OPTIONS.map((opt) => ({ ...opt })),
  bathrooms: BATHROOM_OPTIONS.map((opt) => ({ ...opt })),
  // Derived from price ranges — admin Min/Max catalogs are unused.
  minPrices: deriveMinPriceOptions(defaultPriceRanges, MIN_PRICE_OPTIONS[0]?.label),
  maxPrices: deriveMaxPriceOptions(defaultPriceRanges, MAX_PRICE_OPTIONS[0]?.label),
  features: PROPERTY_LISTING_FEATURE_OPTIONS.map(({ value, label }) => ({ value, label })),
  deliveryDates: DELIVERY_OPTIONS.map((opt) => ({ ...opt })),
  distanceToSea: DISTANCE_OPTIONS.map((opt) => ({ ...opt })),
  guests: GUEST_OPTIONS.map((opt) => ({ ...opt })),
  holidayBudgetRanges: HOLIDAY_BUDGET_OPTIONS.map((opt) => ({ ...opt })),
}
