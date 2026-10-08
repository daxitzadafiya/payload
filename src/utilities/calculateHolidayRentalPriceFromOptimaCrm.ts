/**
 * Optima CRM `properties/calculate-rental-price` (holiday stay total).
 *
 * @see https://my3.optima-crm.com/yiiapp/frontend/web/index.php?r=properties/calculate-rental-price
 */
import { getFromCRMContactWithQuery } from '@/utilities/crmApi.server'
import { dateKeyToUnixSeconds } from '@/utilities/holidayStayTimes'

export type CalculateHolidayRentalPriceInput = {
  /** Property reference (CRM `property`). */
  property: string
  /** Check-in date (`YYYY-MM-DD`) — sent as UTC-midnight Unix seconds. */
  from: string
  /** Check-out date (`YYYY-MM-DD`) — sent as UTC-midnight Unix seconds. */
  to: string
}

export type CalculateHolidayRentalPriceResult = {
  ok: true
  shortTermRentalPrice: number
  shortTermRental: number
  raw: unknown
}

export type CalculateHolidayRentalPriceError = {
  ok: false
  status: number
  message: string
}

const CALCULATE_RENTAL_PRICE_ROUTE = 'properties/calculate-rental-price'

const pickString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : ''

const pickNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

export function validateCalculateHolidayRentalPriceInput(
  input: CalculateHolidayRentalPriceInput,
): string | undefined {
  const property = pickString(input.property)
  const fromDate = pickString(input.from)
  const toDate = pickString(input.to)

  if (!property || !fromDate || !toDate) {
    return 'property, from, and to are required'
  }

  const from = dateKeyToUnixSeconds(fromDate)
  const to = dateKeyToUnixSeconds(toDate)

  if (from == null || to == null || to <= from) {
    return 'Invalid from or to dates'
  }

  return undefined
}

function buildSearchParams(input: CalculateHolidayRentalPriceInput): URLSearchParams {
  const from = dateKeyToUnixSeconds(pickString(input.from))!
  const to = dateKeyToUnixSeconds(pickString(input.to))!

  return new URLSearchParams({
    property: pickString(input.property),
    from: String(from),
    to: String(to),
    booking_calculation: '1',
  })
}

export async function calculateHolidayRentalPriceFromOptimaCrm(
  input: CalculateHolidayRentalPriceInput,
): Promise<CalculateHolidayRentalPriceResult | CalculateHolidayRentalPriceError> {
  const validationError = validateCalculateHolidayRentalPriceInput(input)
  if (validationError) {
    return { ok: false, status: 400, message: validationError }
  }

  const params = buildSearchParams(input)

  try {
    const response = await getFromCRMContactWithQuery(CALCULATE_RENTAL_PRICE_ROUTE, params)
    const responseText = await response.text()

    if (!response.ok) {
      console.error('[CRM calculate-rental-price] failed', {
        status: response.status,
        body: responseText.slice(0, 500),
      })
      return {
        ok: false,
        status: response.status,
        message: `CRM rental price failed (${response.status})`,
      }
    }

    let data: unknown = responseText
    try {
      data = JSON.parse(responseText) as unknown
    } catch {
      return { ok: false, status: 502, message: 'CRM rental price returned invalid JSON' }
    }

    const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
    const shortTermRentalPrice = pickNumber(record?.short_term_rental_price)
    const shortTermRental = pickNumber(record?.short_term_rental)

    if (shortTermRentalPrice == null) {
      return {
        ok: false,
        status: 502,
        message: 'CRM rental price response missing short_term_rental_price',
      }
    }

    return {
      ok: true,
      shortTermRentalPrice,
      shortTermRental: shortTermRental ?? shortTermRentalPrice,
      raw: data,
    }
  } catch (error) {
    console.error('[CRM calculate-rental-price] proxy error:', error)
    return { ok: false, status: 502, message: 'Failed to calculate rental price' }
  }
}
