import type { Payload } from 'payload'

import type { Country } from '@/payload-types'
import { extractCRMList } from '@/utilities/crmProperties'
import { postToCRM } from '@/utilities/crmApi.server'
import { unwrapCRMJsonPayload } from '@/utilities/crmCoasts'
import { getCRMLocalizedText } from '@/utilities/localizedValue'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'
import { localeCodes } from '@/i18n/locales'
import {
  DEFAULT_HERO_COUNTRY_ISO_CODE,
  DEFAULT_SALE_COUNTRY_ISO_CODES,
  type SiteCountryRow,
} from '@/utilities/siteCountries.shared'

const pickNumber = (candidate: unknown): number | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

const pickString = (candidate: unknown, fallback = '') =>
  typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback

const asNamesRecord = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const names: Record<string, string> = {}
  for (const [locale, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text === 'string' && text.trim()) {
      names[locale] = text.trim()
    }
  }
  return names
}

export type SyncCountriesResult = {
  total: number
  added: number
  updated: number
}

type CountryWriteData = Omit<Country, 'id' | 'updatedAt' | 'createdAt'>

let syncInFlight: Promise<SyncCountriesResult> | null = null

async function fetchCRMCountryDocs(): Promise<Record<string, unknown>[]> {
  const response = await postToCRM(
    'countries/find-all',
    {
      query: {},
      options: {
        page: 1,
        limit: 500,
      },
    },
    undefined,
    new URLSearchParams({ lang: 'en' }),
  )

  if (!response.ok) {
    throw new Error(`CRM countries failed (${response.status})`)
  }

  const payload = unwrapCRMJsonPayload((await response.json()) as unknown)
  return extractCRMList(payload)
}

function mapCRMDocToData(
  doc: Record<string, unknown>,
  existing?: SiteCountryRow | null,
): CountryWriteData | null {
  const key = pickNumber(doc.key ?? doc.key_system ?? doc.id)
  if (key === undefined) return null

  const names = asNamesRecord(doc.value)
  const isoCode = pickString(doc.iso_code).toUpperCase()
  const status = pickString(doc.status, 'Active')
  const adminLabel =
    getCRMLocalizedText(names, 'en') ||
    pickString(doc.name) ||
    pickString(doc.country) ||
    isoCode ||
    String(key)

  const isDefaultSaleCountry = DEFAULT_SALE_COUNTRY_ISO_CODES.has(isoCode)
  const isNew = !existing
  const isHeroDefaultCountry = isoCode === DEFAULT_HERO_COUNTRY_ISO_CODE

  return {
    crmId: pickString(doc._id) || existing?.crmId || String(key),
    key,
    isoCode: isoCode || existing?.isoCode || '',
    status,
    names: Object.keys(names).length > 0 ? names : (existing?.names ?? { en: adminLabel }),
    adminLabel,
    isDefault: existing?.isDefault ?? (isNew ? isHeroDefaultCountry : false),
    offerSale: existing?.offerSale ?? (isNew ? isDefaultSaleCountry : false),
    offerRental: existing?.offerRental ?? false,
    offerHoliday: existing?.offerHoliday ?? false,
    salePriceRanges: Array.isArray(existing?.salePriceRanges) ? existing.salePriceRanges : [],
    rentalPriceRanges: Array.isArray(existing?.rentalPriceRanges) ? existing.rentalPriceRanges : [],
    holidayBudgetRanges: Array.isArray(existing?.holidayBudgetRanges)
      ? existing.holidayBudgetRanges
      : [],
  }
}

async function revalidateCountriesCache(payload: Payload): Promise<void> {
  payload.logger.info('Revalidating countries')
  await revalidateCacheTag('collection_countries')
  for (const locale of localeCodes) {
    await revalidateCacheTag(`collection_countries_${locale}`)
  }
}

/**
 * Fetch Optima countries and merge into the Countries collection.
 * Preserves isDefault / transaction flags / price-range selections for existing docs; adds new CRM countries.
 */
export async function syncCountriesFromCRM(payload: Payload): Promise<SyncCountriesResult> {
  if (syncInFlight) return syncInFlight

  syncInFlight = (async () => {
    const crmDocs = await fetchCRMCountryDocs()
    const existingResult = await payload.find({
      collection: 'countries',
      depth: 0,
      limit: 1000,
      pagination: false,
      // Soft-deleted rows still hold unique `key`; include them so sync updates/restores.
      trash: true,
    })

    const existingByKey = new Map(
      existingResult.docs
        .filter((doc) => doc.key != null)
        .map((doc) => [String(doc.key), doc as SiteCountryRow & { id: number }] as const),
    )

    let added = 0
    let updated = 0

    for (const doc of crmDocs) {
      const key = pickNumber(doc.key ?? doc.key_system ?? doc.id)
      if (key === undefined) continue

      const existing = existingByKey.get(String(key)) ?? null
      const data = mapCRMDocToData(doc, existing)
      if (!data) continue

      if (existing?.id != null) {
        await payload.update({
          collection: 'countries',
          id: existing.id,
          data: {
            ...data,
            // Restore if this country was soft-deleted.
            deletedAt: null,
          },
          depth: 0,
          trash: true,
          context: { disableRevalidate: true },
        })
        updated += 1
      } else {
        await payload.create({
          collection: 'countries',
          data,
          depth: 0,
          context: { disableRevalidate: true },
        })
        added += 1
      }
    }

    await revalidateCountriesCache(payload)

    return {
      total: added + updated,
      added,
      updated,
    }
  })().finally(() => {
    syncInFlight = null
  })

  return syncInFlight
}

/** Seed from CRM only when the Countries collection has no docs yet. */
export async function ensureCountriesSeeded(payload: Payload): Promise<void> {
  const counted = await payload.count({
    collection: 'countries',
    trash: true,
  })

  if (counted.totalDocs > 0) return

  await syncCountriesFromCRM(payload)
}
