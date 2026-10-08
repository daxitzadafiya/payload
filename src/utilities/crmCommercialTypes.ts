import { postToCRM } from '@/utilities/crmApi'
import { getSimilarCommercialsQuery } from '@/settings/optimaCrm/client'
import type { FilterSelectOption } from '@/components/FilterSelect'
import { getCRMLocalizedText } from '@/utilities/localizedValue'

import { extractCRMList, type CRMListingPreset } from './crmProperties'

export type CRMCommercialType = {
  key: number
  label: string
}

const pickNumber = (candidate: unknown): number | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

export const buildCommercialTypesRequest = (
  preset: CRMListingPreset = 'forSale',
): Record<string, unknown> => {
  const similarCommercials = getSimilarCommercialsQuery()
  const propStatus = preset === 'sold' ? ['Sold'] : (['Available', 'Under Offer'] as const)

  const query: Record<string, unknown> = {
    prop_status: propStatus,
    ...similarCommercials,
    commercial_properties: 1,
    parent_value: 1,
    type_one_only: 1,
  }

  if (preset === 'forRent' || preset === 'forHoliday') {
    query.rent = true
    if (preset === 'forHoliday') {
      query.st_rental = true
    } else {
      query.lt_rental = true
    }
  } else if (preset !== 'sold') {
    query.sale = true
  }

  return {
    query,
    options: {
      page: 1,
      limit: 200,
    },
  }
}

export const normalizeCRMCommercialType = (
  doc: Record<string, unknown>,
  locale: string,
): CRMCommercialType | null => {
  const key = pickNumber(doc.key)
  if (key === undefined) return null

  const label =
    getCRMLocalizedText(doc.value, locale) ||
    getCRMLocalizedText(doc.parent_value, locale) ||
    String(key)

  return { key, label }
}

export const toPropertyTypeFilterOptions = (types: CRMCommercialType[]): FilterSelectOption[] =>
  types.map((type) => ({
    value: String(type.key),
    label: type.label,
  }))

export const parsePropertyTypeKeys = (values?: string[]): number[] =>
  (values ?? []).map((value) => Number(value)).filter((key) => Number.isFinite(key))

export async function fetchCRMCommercialTypes(
  locale: string,
  preset: CRMListingPreset = 'forSale',
  init?: { signal?: AbortSignal },
): Promise<CRMCommercialType[]> {
  const response = await postToCRM('commercial_types', buildCommercialTypesRequest(preset), {
    signal: init?.signal,
  })

  if (!response.ok) {
    throw new Error(`CRM commercial_types failed (${response.status})`)
  }

  const payload = (await response.json()) as unknown

  return extractCRMList(payload)
    .map((doc) => normalizeCRMCommercialType(doc, locale))
    .filter((type): type is CRMCommercialType => type !== null)
    .sort((a, b) => a.label.localeCompare(b.label, locale))
}
