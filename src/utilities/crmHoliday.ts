import { isCRMTruthy } from '@/utilities/localizedValue'
import {
  calculateHolidayRentalQuote,
  findSeasonForDate,
  formatHolidayListingNightlyRate,
  formatHolidayNightlyRate,
  formatHolidayStayNightlyRate,
  formatHolidayStayTotalSummary,
  getDailyRateForSeason,
  parseRentalSeasons,
  resolvePropertyMinimumStay,
  type HolidayRentalQuote,
} from '@/utilities/holidayRentalPricing'

export const isHolidayRentalProperty = (property: Record<string, unknown>): boolean =>
  isCRMTruthy(property.st_rental)

/** Minimum guests selectable for holiday search / booking. */
export const MIN_HOLIDAY_GUESTS = 1
/** Fallback max when property `sleeps` is missing or 0. */
export const DEFAULT_MAX_HOLIDAY_GUESTS = 25

/** Max guests for a stay: property `sleeps` when > 0, otherwise 25. */
export const resolveMaxHolidayGuests = (sleeps?: number | null): number => {
  if (sleeps != null && Number.isFinite(sleeps) && sleeps > 0) {
    return Math.floor(sleeps)
  }
  return DEFAULT_MAX_HOLIDAY_GUESTS
}

/** Clamp a guest count into `1…maxGuests`. */
export const clampHolidayGuestCount = (value: number, maxGuests: number): number => {
  const max = Math.max(MIN_HOLIDAY_GUESTS, Math.floor(maxGuests))
  if (!Number.isFinite(value) || value < MIN_HOLIDAY_GUESTS) return MIN_HOLIDAY_GUESTS
  return Math.min(Math.floor(value), max)
}

export const parseHolidayGuestCount = (guests?: string): number => {
  if (!guests || guests === 'any') return 2
  const parsed = parseInt(guests.replace(/\D/g, ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2
}

/**
 * Resolve listing guest filter to a CRM `$gte` sleeps value.
 * Custom ("other") values are clamped to 1–{@link DEFAULT_MAX_HOLIDAY_GUESTS}.
 */
export const resolveHolidayGuestsFilterCount = (
  guests?: string,
  guestsCustom?: string,
): number | undefined => {
  if (!guests || guests === 'any') return undefined

  if (guests === 'other') {
    const parsed = parseInt(guestsCustom?.replace(/\D/g, '') ?? '', 10)
    if (!Number.isFinite(parsed) || parsed < MIN_HOLIDAY_GUESTS) return undefined
    return clampHolidayGuestCount(parsed, DEFAULT_MAX_HOLIDAY_GUESTS)
  }

  const parsed = parseInt(guests.replace(/\D/g, ''), 10)
  if (!Number.isFinite(parsed) || parsed < MIN_HOLIDAY_GUESTS) return undefined
  return clampHolidayGuestCount(parsed, DEFAULT_MAX_HOLIDAY_GUESTS)
}

export type HolidayPriceVariant = 'listing' | 'detail'

export type HolidayPriceDisplay = {
  label: string
  summary?: string
  quote?: HolidayRentalQuote
  /** Nightly villa rate — used for sorting */
  nightlyRate?: number
}

export const HOLIDAY_SELECT_DATES_LABEL = 'Select dates for price'
/** Canonical English label — translate at display time via `useTranslation`. */
export const PRICE_ON_DEMAND_LABEL = 'Price on demand'
export const HOLIDAY_PRICE_ON_DEMAND_LABEL = PRICE_ON_DEMAND_LABEL

/** Active `rental_seasons` nightly rate for a given date (defaults to today). */
export const resolveSeasonNightlyRateForDate = (
  property: Record<string, unknown>,
  date: Date = new Date(),
): number | undefined => {
  const season = findSeasonForDate(parseRentalSeasons(property), date)
  if (!season) return undefined
  const rate = getDailyRateForSeason(season)
  return rate != null && rate > 0 ? rate : undefined
}

export const resolveHolidayPriceDisplay = ({
  property,
  periodFrom,
  periodTo,
  guests,
  variant = 'listing',
}: {
  property: Record<string, unknown>
  periodFrom?: string
  periodTo?: string
  guests?: string
  variant?: HolidayPriceVariant
}): HolidayPriceDisplay => {
  const seasons = parseRentalSeasons(property)
  const hasDates = Boolean(periodFrom?.trim() && periodTo?.trim())

  if (hasDates) {
    const quote = calculateHolidayRentalQuote({
      seasons,
      checkIn: periodFrom!,
      checkOut: periodTo!,
      guests: parseHolidayGuestCount(guests),
      minimumStay: resolvePropertyMinimumStay(property),
    })

    if (!quote) {
      return { label: HOLIDAY_PRICE_ON_DEMAND_LABEL }
    }

    return {
      label: formatHolidayStayNightlyRate(quote),
      summary: formatHolidayStayTotalSummary(quote),
      quote,
      nightlyRate: quote.dailyPrice,
    }
  }

  const nightlyRate = resolveSeasonNightlyRateForDate(property)
  if (nightlyRate != null) {
    return {
      label:
        variant === 'detail'
          ? formatHolidayNightlyRate(nightlyRate)
          : formatHolidayListingNightlyRate(nightlyRate),
      nightlyRate,
    }
  }

  return { label: HOLIDAY_PRICE_ON_DEMAND_LABEL }
}

export const parseCRMPropertyBookings = (
  record: Record<string, unknown>,
): import('@/utilities/holidayRentalPricing').CRMPropertyBooking[] => {
  const bookings = record.bookings
  if (!Array.isArray(bookings)) return []
  return bookings.filter(
    (item) => !!item && typeof item === 'object',
  ) as import('@/utilities/holidayRentalPricing').CRMPropertyBooking[]
}
