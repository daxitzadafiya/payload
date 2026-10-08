import { cache } from 'react'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import configPromise from '@payload-config'
import { getCRMLocalizedText } from '@/utilities/localizedValue'
import {
  ensureCountriesSeeded,
  syncCountriesFromCRM,
} from '@/utilities/syncCountriesFromCRM'
import type {
  SiteCountryOption,
  SiteCountryRow,
  SiteCountryTransaction,
} from '@/utilities/siteCountries.shared'

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function mapRowToOption(
  row: SiteCountryRow,
  locale: string,
  transaction: SiteCountryTransaction,
): SiteCountryOption | null {
  const key = typeof row.key === 'number' && Number.isFinite(row.key) ? row.key : null
  if (key === null) return null

  const label =
    getCRMLocalizedText(row.names, locale) ||
    row.adminLabel?.trim() ||
    row.isoCode?.trim() ||
    String(key)

  const priceRangeValues =
    transaction === 'sale'
      ? asStringArray(row.salePriceRanges)
      : transaction === 'rental'
        ? asStringArray(row.rentalPriceRanges)
        : undefined

  const holidayBudgetValues =
    transaction === 'holiday' ? asStringArray(row.holidayBudgetRanges) : undefined

  return {
    value: String(key),
    label,
    key,
    isoCode: row.isoCode?.trim() || undefined,
    isDefault: row.isDefault === true,
    ...(priceRangeValues?.length ? { priceRangeValues } : {}),
    ...(holidayBudgetValues?.length ? { holidayBudgetValues } : {}),
  }
}

function offerFieldForTransaction(transaction: SiteCountryTransaction): keyof SiteCountryRow {
  if (transaction === 'sale') return 'offerSale'
  if (transaction === 'rental') return 'offerRental'
  return 'offerHoliday'
}

function isActiveCountryForTransaction(
  row: SiteCountryRow,
  transaction: SiteCountryTransaction,
): boolean {
  const offerField = offerFieldForTransaction(transaction)
  if (row[offerField] !== true) return false

  const status = row.status?.trim().toLowerCase()
  if (status && status !== 'active') return false
  return true
}

async function findCountries(
  locale: string,
  transaction: SiteCountryTransaction,
): Promise<SiteCountryOption[]> {
  const payload = await getPayload({ config: configPromise })
  await ensureCountriesSeeded(payload)

  const offerField = offerFieldForTransaction(transaction)

  const result = await payload.find({
    collection: 'countries',
    depth: 0,
    limit: 1000,
    pagination: false,
    where: {
      [offerField]: { equals: true },
    },
    sort: 'adminLabel',
  })

  return (result.docs as SiteCountryRow[])
    .filter((row) => isActiveCountryForTransaction(row, transaction))
    .map((row) => mapRowToOption(row, locale, transaction))
    .filter((row): row is SiteCountryOption => row !== null)
    .sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: 'base' }))
}

/**
 * Site countries enabled for transaction-type filters (hero + listing “more filters”).
 * Seeds from CRM automatically when the Countries collection is empty.
 */
export const getSiteCountries = cache(
  async (
    locale = 'en',
    transaction: SiteCountryTransaction = 'sale',
  ): Promise<SiteCountryOption[]> => {
  try {
    const localeKey = locale || 'en'
    return await unstable_cache(
      async () => findCountries(localeKey, transaction),
      ['site-countries', transaction, localeKey],
      {
        tags: ['collection_countries', `collection_countries_${localeKey}`],
      },
    )()
  } catch (error) {
    console.error('Failed to load site countries', error)
    return []
  }
  },
)

/**
 * Backwards-compatible wrapper.
 * Site countries enabled for Sale filters (hero + for-sale listing).
 */
export const getSiteCountriesForSale = cache(async (locale = 'en'): Promise<SiteCountryOption[]> => {
  return getSiteCountries(locale, 'sale')
})

export { syncCountriesFromCRM, ensureCountriesSeeded }
