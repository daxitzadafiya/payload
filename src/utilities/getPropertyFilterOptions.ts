import { cache } from 'react'

import type { PropertyFilter } from '@/payload-types'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { parseCRMSortParams } from '@/utilities/crmProperties'
import {
  DEFAULT_PROPERTY_FILTER_OPTIONS,
  deriveMaxPriceOptions,
  deriveMinPriceOptions,
  type FilterSelectOption,
  type PriceRangeOption,
  type PropertyFilterOptions,
  type PropertySortOption,
} from '@/utilities/propertyFilterOptions.shared'

export type { FilterSelectOption, PriceRangeOption, PropertyFilterOptions, PropertySortOption }

type FilterOptionRow = { value?: string | null; label?: string | null }

type SortOptionRow = FilterOptionRow & { sortParams?: string | null }

function normalizeSortOptions(
  rows: SortOptionRow[] | null | undefined,
  fallback: readonly PropertySortOption[],
): PropertySortOption[] {
  const mapped = (rows ?? [])
    .map((row) => {
      const value = row.value?.trim() ?? ''
      const label = row.label?.trim() ?? ''
      const sort = parseCRMSortParams(row.sortParams ?? '')
      if (!value || !label || !sort) return null
      return { value, label, sort }
    })
    .filter((row): row is PropertySortOption => row !== null)

  return mapped.length > 0 ? mapped : [...fallback]
}

function normalizeSimpleOptions(
  rows: FilterOptionRow[] | null | undefined,
  fallback: readonly FilterSelectOption[],
): FilterSelectOption[] {
  const mapped = (rows ?? [])
    .map((row) => {
      const trimmed = row.value?.trim() ?? ''
      return {
        // Blank / whitespace CRM “any” rows → canonical `any`.
        value: trimmed || 'any',
        label: row.label?.trim() ?? '',
      }
    })
    .filter((row) => row.label.length > 0)

  return mapped.length > 0 ? mapped : [...fallback]
}

function normalizePriceRanges(
  rows: PropertyFilter['priceRanges'],
  fallback: readonly PriceRangeOption[],
): PriceRangeOption[] {
  const mapped = (rows ?? [])
    .map((row) => ({
      value: row.value?.trim() ?? '',
      label: row.label?.trim() ?? '',
      min: row.min?.trim() ?? 'any',
      max: row.max?.trim() ?? 'any',
    }))
    .filter((row) => row.value.length > 0 && row.label.length > 0)

  return mapped.length > 0 ? mapped : [...fallback]
}

export function normalizePropertyFilterOptions(
  doc: PropertyFilter | null | undefined,
): PropertyFilterOptions {
  if (!doc) return DEFAULT_PROPERTY_FILTER_OPTIONS

  const priceRanges = normalizePriceRanges(
    doc.priceRanges,
    DEFAULT_PROPERTY_FILTER_OPTIONS.priceRanges,
  )

  return {
    sortOptions: normalizeSortOptions(doc.sortOptions, DEFAULT_PROPERTY_FILTER_OPTIONS.sortOptions),
    priceRanges,
    bedrooms: normalizeSimpleOptions(doc.bedrooms, DEFAULT_PROPERTY_FILTER_OPTIONS.bedrooms),
    bathrooms: normalizeSimpleOptions(doc.bathrooms, DEFAULT_PROPERTY_FILTER_OPTIONS.bathrooms),
    // More Filters Min/Max options are derived from price ranges (not admin catalogs).
    minPrices: deriveMinPriceOptions(priceRanges),
    maxPrices: deriveMaxPriceOptions(priceRanges),
    features: normalizeSimpleOptions(doc.features, DEFAULT_PROPERTY_FILTER_OPTIONS.features),
    deliveryDates: normalizeSimpleOptions(
      doc.deliveryDates,
      DEFAULT_PROPERTY_FILTER_OPTIONS.deliveryDates,
    ),
    distanceToSea: normalizeSimpleOptions(
      doc.distanceToSea,
      DEFAULT_PROPERTY_FILTER_OPTIONS.distanceToSea,
    ),
    guests: normalizeSimpleOptions(doc.guests, DEFAULT_PROPERTY_FILTER_OPTIONS.guests),
    holidayBudgetRanges: normalizePriceRanges(
      doc.holidayBudgetRanges,
      DEFAULT_PROPERTY_FILTER_OPTIONS.holidayBudgetRanges,
    ),
  }
}

export const getPropertyFilterOptions = cache(
  async (locale?: string): Promise<PropertyFilterOptions> => {
    const getGlobal = getCachedGlobal('propertyFilters', 0, locale as never)
    const doc = await getGlobal()
    return normalizePropertyFilterOptions(doc)
  },
)
