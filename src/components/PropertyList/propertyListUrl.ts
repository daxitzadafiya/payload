/** CRM property list URL params (server-prefetched + client filter/sort navigation). */

import { formatCRMOrderbyEntries } from '@/utilities/crmPropertiesGetParams'
import type { PropertySortOption } from '@/utilities/propertyFilterOptions.shared'

export const PROPERTY_LIST_PAGE_PARAM = 'page'
/** @deprecated Prefer orderby[] — kept for legacy URLs only */
export const PROPERTY_LIST_SORT_PARAM = 'sort'
export const PROPERTY_LIST_ORDERBY_PARAM = 'orderby[]'

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | null
  | undefined

type ListingQueryUpdates = {
  page?: number
  /** Sort option value (e.g. recent, priceAsc) — written as orderby[] for GET listings */
  sort?: string | null
}

function toSearchParams(current?: URLSearchParams | string | null): URLSearchParams {
  return new URLSearchParams(
    typeof current === 'string' ? current : (current?.toString() ?? ''),
  )
}

export function parsePropertyListPage(searchParams: SearchParamsLike): number {
  const raw =
    searchParams instanceof URLSearchParams
      ? searchParams.get(PROPERTY_LIST_PAGE_PARAM)
      : searchParams?.[PROPERTY_LIST_PAGE_PARAM]
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = Number.parseInt(value ?? '1', 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
}

export function parseOrderbyEntriesFromSearchParams(searchParams: SearchParamsLike): string[] {
  if (!searchParams) return []

  if (searchParams instanceof URLSearchParams) {
    const direct = searchParams.getAll(PROPERTY_LIST_ORDERBY_PARAM)
    if (direct.length) {
      return direct.map((entry) => entry.trim()).filter(Boolean)
    }

    const entries: string[] = []
    searchParams.forEach((value, key) => {
      if (key === 'orderby' || key.startsWith('orderby[')) {
        entries.push(value)
      }
    })
    return entries.map((entry) => entry.trim()).filter(Boolean)
  }

  const entries: string[] = []
  for (const [key, raw] of Object.entries(searchParams)) {
    if (key === PROPERTY_LIST_ORDERBY_PARAM || key === 'orderby' || key.startsWith('orderby[')) {
      if (Array.isArray(raw)) entries.push(...raw)
      else if (typeof raw === 'string' && raw.trim()) entries.push(raw)
    }
  }

  return entries.map((entry) => entry.trim()).filter(Boolean)
}

const orderbyEntriesMatch = (
  left: string[],
  right: string[],
): boolean => {
  if (left.length !== right.length) return false
  return left.every((entry, index) => entry === right[index])
}

export function findSortOptionByOrderbyEntries(
  orderbyEntries: string[],
  sortOptions: PropertySortOption[],
): PropertySortOption | undefined {
  if (!orderbyEntries.length) return undefined

  return sortOptions.find((option) =>
    orderbyEntriesMatch(formatCRMOrderbyEntries(option.sort), orderbyEntries),
  )
}

export function findSortOptionByValue(
  sortValue: string | null | undefined,
  sortOptions: PropertySortOption[],
): PropertySortOption | undefined {
  const trimmed = sortValue?.trim()
  if (!trimmed) return undefined
  return sortOptions.find((option) => option.value === trimmed)
}

export function clearPropertyListOrderbyParams(params: URLSearchParams): void {
  params.delete(PROPERTY_LIST_SORT_PARAM)
  params.delete(PROPERTY_LIST_ORDERBY_PARAM)
  for (const key of [...params.keys()]) {
    if (key === 'orderby' || key.startsWith('orderby[')) {
      params.delete(key)
    }
  }
}

export function setPropertyListOrderbyParams(
  params: URLSearchParams,
  sortOption: PropertySortOption,
): void {
  clearPropertyListOrderbyParams(params)
  for (const entry of formatCRMOrderbyEntries(sortOption.sort)) {
    params.append(PROPERTY_LIST_ORDERBY_PARAM, entry)
  }
}

export function parsePropertyListSort(
  searchParams: SearchParamsLike,
  fallback: string,
  sortOptions?: PropertySortOption[],
): string {
  const orderbyEntries = parseOrderbyEntriesFromSearchParams(searchParams)
  if (orderbyEntries.length && sortOptions?.length) {
    const fromOrderby = findSortOptionByOrderbyEntries(orderbyEntries, sortOptions)
    if (fromOrderby) return fromOrderby.value
  }

  const raw =
    searchParams instanceof URLSearchParams
      ? searchParams.get(PROPERTY_LIST_SORT_PARAM)
      : searchParams?.[PROPERTY_LIST_SORT_PARAM]
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim()
  return value || fallback
}

export function buildPropertyListListingQuery(
  updates: ListingQueryUpdates,
  current?: URLSearchParams | string | null,
  sortOptions?: PropertySortOption[],
): string {
  const params = toSearchParams(current)

  if (updates.page !== undefined) {
    if (updates.page <= 1) params.delete(PROPERTY_LIST_PAGE_PARAM)
    else params.set(PROPERTY_LIST_PAGE_PARAM, String(updates.page))
  }

  if (updates.sort !== undefined) {
    clearPropertyListOrderbyParams(params)
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function stripOrderbyFromListingHref(
  pathname: string,
  current?: URLSearchParams | string | null,
): string {
  const params = toSearchParams(current)
  clearPropertyListOrderbyParams(params)
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function buildPropertyListListingHref(
  pathname: string,
  updates: ListingQueryUpdates,
  current?: URLSearchParams | string | null,
  sortOptions?: PropertySortOption[],
): string {
  return `${pathname}${buildPropertyListListingQuery(updates, current, sortOptions)}`
}

/** @deprecated Use buildPropertyListListingHref */
export function buildPropertyListPageHref(
  pathname: string,
  page: number,
  current?: URLSearchParams | string | null,
): string {
  return buildPropertyListListingHref(pathname, { page }, current)
}
