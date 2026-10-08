export type SiteCountryTransaction = 'sale' | 'rental' | 'holiday'

export type SiteCountryOption = {
  value: string
  label: string
  key: number
  isoCode?: string
  /** When true, pre-selected in the Sale hero country filter. */
  isDefault?: boolean
  /** Selected Property Filters price-range values for sale/rental. Empty = all. */
  priceRangeValues?: string[]
  /** Selected Property Filters holiday-budget values. Empty = all. */
  holidayBudgetValues?: string[]
}

export type SiteCountryRow = {
  id?: number | string | null
  crmId?: string | null
  key?: number | null
  isoCode?: string | null
  status?: string | null
  adminLabel?: string
  names?: Record<string, string> | null
  isDefault?: boolean | null
  offerSale?: boolean | null
  offerRental?: boolean | null
  offerHoliday?: boolean | null
  salePriceRanges?: string[] | null
  rentalPriceRanges?: string[] | null
  holidayBudgetRanges?: string[] | null
}

/** ISO codes enabled for sale by default when first synced. */
export const DEFAULT_SALE_COUNTRY_ISO_CODES = new Set(['ES', 'FR', 'PT'])

/** ISO code used as the Sale hero default when first synced (if none is set). */
export const DEFAULT_HERO_COUNTRY_ISO_CODE = 'ES'
