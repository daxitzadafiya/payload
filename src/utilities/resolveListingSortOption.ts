import {
  findSortOptionByOrderbyEntries,
  findSortOptionByValue,
} from '@/components/PropertyList/propertyListUrl'
import { DEFAULT_PROPERTY_FILTER_OPTIONS } from '@/utilities/propertyFilterOptions.shared'
import type { PropertySortOption } from '@/utilities/propertyFilterOptions.shared'
import { getPropertyFilterOptions } from '@/utilities/getPropertyFilterOptions'

/** Resolve list sort from URL orderby[] (or legacy sort=) without hitting CMS when defaults match. */
export async function resolveListingSortOption(
  sortValue?: string | null,
  locale?: string,
  orderbyEntries?: string[],
): Promise<PropertySortOption> {
  const defaults = DEFAULT_PROPERTY_FILTER_OPTIONS.sortOptions

  if (orderbyEntries?.length) {
    const fromDefaults = findSortOptionByOrderbyEntries(orderbyEntries, defaults)
    if (fromDefaults) return fromDefaults

    const filterOptions = await getPropertyFilterOptions(locale)
    const fromCms = findSortOptionByOrderbyEntries(orderbyEntries, filterOptions.sortOptions)
    if (fromCms) return fromCms
  }

  const trimmed = sortValue?.trim()

  if (trimmed) {
    const fromDefaults = findSortOptionByValue(trimmed, defaults)
    if (fromDefaults) return fromDefaults
  }

  if (trimmed) {
    const filterOptions = await getPropertyFilterOptions(locale)
    const fromCms = findSortOptionByValue(trimmed, filterOptions.sortOptions)
    if (fromCms) return fromCms
  }

  return defaults[0]
}
