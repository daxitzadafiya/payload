import {
  HOLIDAY_SELECT_DATES_LABEL,
  PRICE_ON_DEMAND_LABEL,
} from '@/utilities/crmHoliday'

/** Canonical English fallback — translate at display via `useTranslation`. */
export const PRICE_ON_REQUEST_LABEL = 'Price on request'

export type PropertyPriceLabels = {
  priceOnDemand: string
  priceOnRequest: string
  selectDatesForPrice: string
  from: string
  perNight: string
  perMonth: string
  perYear: string
  nights: string
  guests: string
  perPersonPerNight: string
}

const PRICE_LABELS_WITHOUT_FROM = new Set<string>([
  PRICE_ON_DEMAND_LABEL,
  PRICE_ON_REQUEST_LABEL,
  HOLIDAY_SELECT_DATES_LABEL,
])

/**
 * Prefix a holiday rental card price with the English token `from `.
 * Display localization swaps that token for `propertyList.card.priceFromLabel`.
 * Demand / request / select-dates labels stay unchanged.
 * Long-term rentals do not use this prefix.
 */
export function withRentalPriceFromPrefix(price: string | undefined): string {
  const value = price?.trim() ?? ''
  if (!value || PRICE_LABELS_WITHOUT_FROM.has(value)) return value
  if (/^from\s+/i.test(value)) return value
  return `from ${value}`
}

/** Localize CRM/holiday price strings that are composed in English. */
export function localizePropertyPrice(
  price: string | undefined,
  labels: PropertyPriceLabels,
): string {
  if (!price) return ''

  if (price === PRICE_ON_DEMAND_LABEL) return labels.priceOnDemand
  if (price === PRICE_ON_REQUEST_LABEL) return labels.priceOnRequest
  if (price === HOLIDAY_SELECT_DATES_LABEL) return labels.selectDatesForPrice

  let result = price

  const fromPrefix = result.match(/^from\s+/i)
  if (fromPrefix) {
    result = `${labels.from} ${result.slice(fromPrefix[0].length)}`
  }

  result = result.replace(/ \/night$/u, ` ${labels.perNight}`)
  result = result.replace(/ \/ night$/u, ` ${labels.perNight}`)
  result = result.replace(/ per month$/u, ` ${labels.perMonth}`)
  result = result.replace(/ per year$/u, ` ${labels.perYear}`)
  result = result.replace(/ per person \/ night$/u, ` ${labels.perPersonPerNight}`)
  result = result.replace(/ × (\d+) nights/u, (_match, count: string) => ` × ${count} ${labels.nights}`)
  result = result.replace(/ × (\d+) guests/u, (_match, count: string) => ` × ${count} ${labels.guests}`)

  return result
}
