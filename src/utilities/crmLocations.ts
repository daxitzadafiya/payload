import { postToCRM } from '@/utilities/crmApi'
import { getSimilarCommercialsQuery } from '@/settings/optimaCrm/client'
import { getCRMLocalizedText } from '@/utilities/localizedValue'

import { extractCRMList, type CRMListingPreset } from './crmProperties'

export type CRMLocationArea = {
  key: number
  cityKey: number
  label: string
}

export type CRMLocationCity = {
  key: number
  label: string
  areas: CRMLocationArea[]
}

const pickNumber = (candidate: unknown): number | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

export const buildGeoDataRequest = (
  preset: CRMListingPreset = 'forSale',
  mode: 'cities' | 'locations',
): Record<string, unknown> => {
  const similarCommercials = getSimilarCommercialsQuery()
  const propStatus = preset === 'sold' ? ['Sold'] : (['Available', 'Under Offer'] as const)

  const query: Record<string, unknown> = {
    sort: 'en',
    order: 'ASC',
    prop_status: propStatus,
    ...similarCommercials,
    ...(mode === 'cities' ? { allow_cities: true } : { allow_location: true }),
  }

  if (preset === 'forRent') {
    query.rent = true
    query.lt_rental = true
  } else if (preset === 'forHoliday') {
    query.rent = true
    query.st_rental = true
  } else if (preset !== 'sold') {
    query.sale = true
  }

  return { query }
}

const normalizeCity = (
  doc: Record<string, unknown>,
  locale: string,
): { key: number; label: string } | null => {
  const key = pickNumber(doc.key)
  if (key === undefined) return null

  const label =
    getCRMLocalizedText(doc.value, locale) ||
    getCRMLocalizedText(doc.accent_value, locale) ||
    String(key)

  return { key, label }
}

const normalizeArea = (doc: Record<string, unknown>, locale: string): CRMLocationArea | null => {
  const key = pickNumber(doc.key)
  const cityKey = pickNumber(doc.city)
  if (key === undefined || cityKey === undefined) return null

  const label =
    getCRMLocalizedText(doc.value, locale) ||
    getCRMLocalizedText(doc.accent_value, locale) ||
    String(key)

  return { key, cityKey, label }
}

export const buildLocationTree = (
  cities: { key: number; label: string }[],
  areas: CRMLocationArea[],
  locale: string,
): CRMLocationCity[] => {
  const cityByKey = new Map(cities.map((city) => [city.key, city]))
  const areasByCity = new Map<number, CRMLocationArea[]>()

  for (const area of areas) {
    const bucket = areasByCity.get(area.cityKey) ?? []
    bucket.push(area)
    areasByCity.set(area.cityKey, bucket)
  }

  const tree: CRMLocationCity[] = []

  for (const [cityKey, cityAreas] of areasByCity) {
    const city = cityByKey.get(cityKey)
    const sortedAreas = [...cityAreas].sort((a, b) => a.label.localeCompare(b.label, locale))

    tree.push({
      key: cityKey,
      label: city?.label ?? sortedAreas[0]?.label ?? String(cityKey),
      areas: sortedAreas,
    })
  }

  return tree.sort((a, b) => a.label.localeCompare(b.label, locale))
}

export const parseLocationKeys = (values?: string[]): number[] =>
  (values ?? []).map((value) => Number(value)).filter((key) => Number.isFinite(key))

export async function fetchCRMGeoData(
  locale: string,
  preset: CRMListingPreset = 'forSale',
  mode: 'cities' | 'locations',
  init?: { signal?: AbortSignal },
): Promise<Record<string, unknown>[]> {
  const response = await postToCRM(
    'locations/geo-data-if-property-exists',
    buildGeoDataRequest(preset, mode),
    { signal: init?.signal },
  )

  if (!response.ok) {
    throw new Error(`CRM geo-data (${mode}) failed (${response.status})`)
  }

  const payload = (await response.json()) as unknown
  return extractCRMList(payload)
}

export async function fetchCRMLocationTree(
  locale: string,
  preset: CRMListingPreset = 'forSale',
  init?: { signal?: AbortSignal },
): Promise<CRMLocationCity[]> {
  const [cityDocs, areaDocs] = await Promise.all([
    fetchCRMGeoData(locale, preset, 'cities', init),
    fetchCRMGeoData(locale, preset, 'locations', init),
  ])

  const cities = cityDocs
    .map((doc) => normalizeCity(doc, locale))
    .filter((city): city is { key: number; label: string } => city !== null)

  const areas = areaDocs
    .map((doc) => normalizeArea(doc, locale))
    .filter((area): area is CRMLocationArea => area !== null)

  return buildLocationTree(cities, areas, locale)
}
