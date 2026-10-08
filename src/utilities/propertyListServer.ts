import type { PropertyListInitialData } from '@/components/PropertyList/PropertyListServerData'
import { extractPropertyListPreloadImageUrls } from '@/components/PropertyList/propertyListImagePreload'
import { buildCRMListingQuery, type CRMListingPreset } from '@/utilities/crmProperties'
import { fetchCRMPropertiesServer } from '@/utilities/crmProperties.server'
import { buildCRMProjectsQuery } from '@/utilities/crmProjects'
import { fetchCRMProjectsServer } from '@/utilities/crmProjects.server'
import { resolveListingSortOption } from '@/utilities/resolveListingSortOption'

export async function fetchPropertyListServerData({
  preset,
  crmCity,
  crmQueryJson,
  pageSize,
  page,
  sortValue,
  orderbyEntries = [],
  locale = 'en',
}: {
  preset: CRMListingPreset
  crmCity?: number | null
  crmQueryJson?: string | null
  pageSize: number
  page: number
  sortValue?: string | null
  orderbyEntries?: string[]
  locale?: string
}): Promise<PropertyListInitialData | null> {
  if (preset === 'favorites') return null

  const sortOption = await resolveListingSortOption(sortValue, undefined, orderbyEntries)

  if (preset === 'projects') {
    const body = buildCRMProjectsQuery({
      page,
      pageSize,
      filters: {},
      sortParams: sortOption.sort,
    })
    const result = await fetchCRMProjectsServer(body, { locale })

    return {
      page,
      properties: result.properties,
      total: result.total,
      sort: sortOption.value,
      preloadImageUrls: extractPropertyListPreloadImageUrls(result.properties),
    }
  }

  // City-wise without a city must not return the full for-sale catalogue.
  if (preset === 'cityWise' && (crmCity == null || !Number.isFinite(Number(crmCity)))) {
    return {
      page,
      properties: [],
      total: 0,
      sort: sortOption.value,
      preloadImageUrls: [],
    }
  }

  const body = buildCRMListingQuery({
    preset,
    crmCity,
    crmQueryJson,
    page,
    pageSize,
    filters: {},
    sortParams: sortOption.sort,
  })

  const result = await fetchCRMPropertiesServer(body, { preset })

  return {
    page,
    properties: result.properties,
    total: result.total,
    sort: sortOption.value,
    preloadImageUrls: extractPropertyListPreloadImageUrls(result.properties),
  }
}
