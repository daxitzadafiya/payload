'use client'

import { useMemo } from 'react'

import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions'
import {
  deriveMaxPriceOptions,
  deriveMinPriceOptions,
  filterRangeOptions,
  type PropertySortOption,
} from '@/utilities/propertyFilterOptions.shared'
import { useTranslation } from '@/utilities/translateClient'

/**
 * Option labels come from the Property Filters global (localized + DeepL).
 * Do not overlay Translations-collection keys — those duplicate CMS content.
 * Exception: derived Min/Max “any” labels are static UI strings, not CMS rows.
 */

export function useSortOptions(): PropertySortOption[] {
  const { sortOptions } = usePropertyFilterOptions()
  return sortOptions
}

export function usePriceRangeOptions(selectedValues?: readonly string[] | null) {
  const { priceRanges } = usePropertyFilterOptions()
  return useMemo(
    () => filterRangeOptions(priceRanges, selectedValues),
    [priceRanges, selectedValues],
  )
}

export function useBedroomOptions() {
  const { bedrooms } = usePropertyFilterOptions()
  return bedrooms
}

export function useBathroomOptions() {
  const { bathrooms } = usePropertyFilterOptions()
  return bathrooms
}

export function useMinPriceOptions(selectedValues?: readonly string[] | null) {
  const { priceRanges } = usePropertyFilterOptions()
  const anyLabel = useTranslation('propertyList.filters.anyMinPrice', 'Any Min Price')
  return useMemo(
    () => deriveMinPriceOptions(filterRangeOptions(priceRanges, selectedValues), anyLabel),
    [priceRanges, selectedValues, anyLabel],
  )
}

export function useMaxPriceOptions(selectedValues?: readonly string[] | null) {
  const { priceRanges } = usePropertyFilterOptions()
  const anyLabel = useTranslation('propertyList.filters.anyMaxPrice', 'Any Max Price')
  return useMemo(
    () => deriveMaxPriceOptions(filterRangeOptions(priceRanges, selectedValues), anyLabel),
    [priceRanges, selectedValues, anyLabel],
  )
}

export function useFeatureFilterOptions() {
  const { features } = usePropertyFilterOptions()
  return features
}

export function useDeliveryDateOptions() {
  const { deliveryDates } = usePropertyFilterOptions()
  return deliveryDates
}

export function useDistanceToSeaOptions() {
  const { distanceToSea } = usePropertyFilterOptions()
  return distanceToSea
}

export function useGuestOptions() {
  const { guests } = usePropertyFilterOptions()
  return guests
}

export function useHolidayBudgetOptions(selectedValues?: readonly string[] | null) {
  const { holidayBudgetRanges } = usePropertyFilterOptions()
  return useMemo(
    () => filterRangeOptions(holidayBudgetRanges, selectedValues),
    [holidayBudgetRanges, selectedValues],
  )
}
