/**
 * Optima CRM map markers.
 * Browser → `/api/crm/commercial-properties/find-all` → NestJS MODE base
 * `commercial_properties/find-all?user=…&latLang=1&selectedFields=1` (same query as before).
 */
import { getSimilarCommercialsQuery } from '@/settings/optimaCrm/client'
import {
  buildFavoriteIdsClause,
  buildFilterQuery,
  CRM_PROPERTY_ATTACHMENTS_POPULATE,
  extractCRMList,
  extractCRMTotal,
  mergeCRMQueryObjects,
  parseCRMCustomQuery,
  withSimilarCommercialsDefault,
  withCRMCoordinateQueryFields,
  type CRMListingPreset,
  type PropertyListFilters,
} from '@/utilities/crmProperties'
import { buildCRMProjectsSearchParams } from '@/utilities/crmProjects'

const MAP_AVAILABLE_STATUSES = ['Available', 'Under Offer'] as const
const MAP_SOLD_STATUSES = ['Sold'] as const

export type MapPropertyPoint = {
  id: string
  reference: string
  lat: number
  lng: number
}

const pickCoordinate = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export const normalizeMapPropertyPoint = (
  raw: Record<string, unknown>,
): MapPropertyPoint | null => {
  const lat = pickCoordinate(raw.latitude)
  const lng = pickCoordinate(raw.longitude)

  if (lat === null || lng === null) return null
  if (lat === 0 && lng === 0) return null

  const id = typeof raw._id === 'string' && raw._id.trim() ? raw._id.trim() : undefined
  const referenceRaw = raw.reference ?? raw.id
  const reference =
    typeof referenceRaw === 'number'
      ? String(referenceRaw)
      : typeof referenceRaw === 'string' && referenceRaw.trim()
        ? referenceRaw.trim()
        : undefined

  if (!id && !reference) return null

  return {
    id: id ?? reference!,
    reference: reference ?? id!,
    lat,
    lng,
  }
}

export { CRM_PROPERTY_ATTACHMENTS_POPULATE as MAP_FIND_ALL_POPULATE } from '@/utilities/crmProperties'

/** CRM find-all page/limit + sort + populate — matches Optima map API expectations. */
export const buildCRMMapOptions = (
  page: number,
  limit: number,
  sortParams?: Record<string, unknown>,
): Record<string, unknown> => ({
  page: Math.max(1, page),
  limit: Math.max(1, limit),
  sort:
    sortParams && Object.keys(sortParams).length > 0
      ? sortParams
      : {
          current_price: '-1',
        },
  populate: CRM_PROPERTY_ATTACHMENTS_POPULATE,
})

const buildCRMMapBaseQuery = (preset: CRMListingPreset): Record<string, unknown> => {
  const similarCommercials = getSimilarCommercialsQuery()

  if (preset === 'sold') {
    return {
      ...similarCommercials,
      sale: true,
      archived: { $ne: true },
      // has_images: true,
      status: { $in: [...MAP_SOLD_STATUSES] },
    }
  }

  if (preset === 'forRent') {
    return {
      ...similarCommercials,
      rent: true,
      lt_rental: true,
      status: { $in: [...MAP_AVAILABLE_STATUSES] },
    }
  }

  if (preset === 'forHoliday') {
    return {
      ...similarCommercials,
      rent: true,
      st_rental: true,
      status: { $in: [...MAP_AVAILABLE_STATUSES] },
    }
  }

  if (preset === 'favorites') {
    // Favorites fetch by explicit _id $in — do not send similar_commercials.
    return {
      // ...similarCommercials,
      archived: { $ne: true },
      // has_images: true,
    }
  }

  const baseQuery: Record<string, unknown> = {
    ...similarCommercials,
    sale: true,
    archived: { $ne: true },
    // has_images: true,
    status: { $in: [...MAP_AVAILABLE_STATUSES] },
  }

  if (preset === 'seaView') {
    baseQuery['views.sea'] = true
  } else if (preset === 'beachSide') {
    baseQuery['views.beach'] = true
  } else if (preset === 'newDevelopments') {
    baseQuery.project=true
  } else if (preset === 'golf') {
    baseQuery.$and = [
      {
        $or: [
          { 'categories.golf': true },
          { 'views.golf': true },
          { 'settings.frontline_golf': true },
          { 'settings.close_to_golf': true },
        ],
      },
    ]
  } else if (preset === 'resaleHomes') {
    baseQuery.project = false
  } else if (preset === 'featured') {
    // Featured listings always include similar commercials, regardless of Optima CRM global.
    baseQuery.similar_commercials = 'include_similar'
    baseQuery.featured = true
  }

  return baseQuery
}

/** find-all must not send remove_count; core query fields always enforced per preset. */
export const normalizeMapFindAllQuery = (
  query: Record<string, unknown>,
  preset: CRMListingPreset,
): Record<string, unknown> => {
  const { remove_count: _removeCount, ...rest } = query

  const withoutRemoveCount: Record<string, unknown> = {
    ...rest,
    archived: { $ne: true },
    // has_images: true,
  }

  // Favorites omit similar_commercials (id list only); other presets use the global default.
  let withSimilar: Record<string, unknown>
  if (preset === 'favorites') {
    const { similar_commercials: _similar, ...query } = withoutRemoveCount
    withSimilar = query
  } else {
    withSimilar = withSimilarCommercialsDefault(withoutRemoveCount)
  }

  const normalized: Record<string, unknown> = withCRMCoordinateQueryFields(withSimilar)

  if (preset !== 'favorites') {
    if (preset === 'forRent') {
      normalized.rent = true
      normalized.lt_rental = true
      delete normalized.sale
      delete normalized.st_rental
    } else if (preset === 'forHoliday') {
      normalized.rent = true
      normalized.st_rental = true
      delete normalized.sale
    } else {
      normalized.sale = true
    }
  }

  if (preset === 'sold') {
    normalized.status = { $in: [...MAP_SOLD_STATUSES] }
  } else if (preset === 'custom' || preset === 'favorites' || preset === 'resaleHomes') {
    if (!normalized.status) {
      normalized.status = { $in: [...MAP_AVAILABLE_STATUSES] }
    }
  } else {
    normalized.status = { $in: [...MAP_AVAILABLE_STATUSES] }
  }

  normalized.frontend_api = true

  return normalized
}

export const buildCRMMapQuery = ({
  preset,
  crmQueryJson,
  crmCity,
  filters = {},
  restrictToFavoriteIds,
  page,
  pageSize,
  sortParams,
}: {
  preset: CRMListingPreset
  crmQueryJson?: string | null
  crmCity?: number | string | null
  filters?: PropertyListFilters
  restrictToFavoriteIds?: (string | number)[]
  page: number
  pageSize: number
  sortParams?: Record<string, unknown>
}): Record<string, unknown> => {
  let baseQuery = buildCRMMapBaseQuery(preset)

  if (preset === 'custom' && typeof crmQueryJson === 'string' && crmQueryJson.trim()) {
    const parsedQuery = parseCRMCustomQuery(crmQueryJson)
    const parsedBase =
      parsedQuery?.query && typeof parsedQuery.query === 'object'
        ? (parsedQuery.query as Record<string, unknown>)
        : null

    if (parsedBase) {
      baseQuery = mergeCRMQueryObjects(
        {
          ...getSimilarCommercialsQuery(),
          sale: true,
          archived: { $ne: true },
          // has_images: true,
        },
        parsedBase,
      )
    }
  }

  let query = mergeCRMQueryObjects(
    baseQuery,
    buildFilterQuery(filters, { includeMapReferences: true }),
  )

  if (preset === 'cityWise') {
    const cityId = Number(crmCity)
    if (Number.isFinite(cityId)) {
      query = { ...query, city: { $in: [cityId] } }
    }
  }

  if (preset === 'favorites' && restrictToFavoriteIds?.length) {
    const favoriteClause = buildFavoriteIdsClause(restrictToFavoriteIds)
    if (favoriteClause) {
      query = mergeCRMQueryObjects(query, favoriteClause)
    }
  }

  return {
    options: buildCRMMapOptions(page, pageSize, sortParams),
    query: normalizeMapFindAllQuery(query, preset),
  }
}

export async function fetchCRMMapProperties({
  preset,
  crmQueryJson,
  crmCity,
  filters = {},
  restrictToFavoriteIds,
  pageSize = 5000,
  signal,
}: {
  preset: CRMListingPreset
  crmQueryJson?: string | null
  crmCity?: number | string | null
  filters?: PropertyListFilters
  restrictToFavoriteIds?: (string | number)[]
  pageSize?: number
  signal?: AbortSignal
}): Promise<{ properties: MapPropertyPoint[]; total: number }> {
  const body = buildCRMMapQuery({
    preset,
    crmQueryJson,
    crmCity,
    filters,
    restrictToFavoriteIds,
    page: 1,
    pageSize,
  })

  const response = await fetch('/api/crm/commercial-properties/find-all', {
    method: 'POST',
    cache: 'no-store',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`CRM map API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const list = extractCRMList(data)
  const total = extractCRMTotal(data, list.length)

  const properties: MapPropertyPoint[] = []
  const seen = new Set<string>()

  for (const item of list) {
    const point = normalizeMapPropertyPoint(item)
    if (!point) continue

    const key = `${point.id}:${point.reference}`
    if (seen.has(key)) continue
    seen.add(key)
    properties.push(point)
  }

  return { properties, total }
}

/**
 * Project/construction map markers via Yii constructions?latlng=true (+ current filters).
 * Matches gestali Developments::findAll(...&latlng=true).
 */
export async function fetchCRMMapProjects({
  filters = {},
  pageSize = 100,
  signal,
  locale = 'en',
}: {
  filters?: PropertyListFilters
  pageSize?: number
  signal?: AbortSignal
  locale?: string
}): Promise<{ properties: MapPropertyPoint[]; total: number }> {
  const params = buildCRMProjectsSearchParams({
    page: 1,
    pageSize: Math.max(1, pageSize),
    filters,
    latlng: true,
  })

  const response = await fetch('/api/crm/constructions', {
    method: 'POST',
    cache: 'no-store',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      _yiiSearchParams: params.toString(),
      locale,
      latlng: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`CRM project map API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const asRecord = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
  const list = Array.isArray(asRecord?.properties)
    ? (asRecord.properties as Record<string, unknown>[])
    : []

  const properties: MapPropertyPoint[] = []
  const seen = new Set<string>()

  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const point =
      'lat' in item && 'lng' in item
        ? ({
            id: String((item as MapPropertyPoint).id ?? (item as MapPropertyPoint).reference),
            reference: String((item as MapPropertyPoint).reference ?? (item as MapPropertyPoint).id),
            lat: Number((item as MapPropertyPoint).lat),
            lng: Number((item as MapPropertyPoint).lng),
          } satisfies MapPropertyPoint)
        : normalizeMapPropertyPoint(item as Record<string, unknown>)

    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) continue
    if (point.lat === 0 && point.lng === 0) continue

    const key = `${point.id}:${point.reference}`
    if (seen.has(key)) continue
    seen.add(key)
    properties.push(point)
  }

  return { properties, total: properties.length }
}
