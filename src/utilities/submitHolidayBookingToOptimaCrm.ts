/**
 * Optima CRM `bookings/create-booking` (holiday rental enquiries).
 *
 * @see https://my3.optima-crm.com/yiiapp/frontend/web/index.php?r=bookings/create-booking
 */
import { getFromCRMContactWithQueryUsingUserKey } from '@/utilities/crmApi.server'
import {
  arrivalDateKeyToUnixSeconds,
  departureDateKeyToUnixSeconds,
} from '@/utilities/holidayStayTimes'

export type CreateHolidayBookingInput = {
  property_reference: string
  email: string
  forename: string
  mobile: string
  /** Check-in date (`YYYY-MM-DD`) — converted to Unix seconds at 15:00 Europe/Athens for CRM. */
  arrival: string
  /** Check-out date (`YYYY-MM-DD`) — converted to Unix seconds at 11:00 Europe/Athens for CRM. */
  departure: string
  surname?: string
  guests?: number
  message?: string
  /** CRM field `f_title` (optional salutation / title). */
  f_title?: string
  /** Defaults to `enquiry`. */
  status?: string
  /** reCAPTCHA token (server-side verified if secret key is configured). */
  recaptchaToken?: string
  /** Must accept privacy policy / terms before booking enquiry. */
  terms_accepted?: boolean
}

export type CreateHolidayBookingResult = {
  ok: true
  data: unknown
}

export type CreateHolidayBookingError = {
  ok: false
  status: number
  message: string
}

const CREATE_BOOKING_ROUTE = 'bookings/create-booking'
const DEFAULT_BOOKING_STATUS = 'enquiry'

const pickString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : ''

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const pickGuestCount = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }
  const parsed = parseInt(pickString(value).replace(/\D/g, ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export function validateCreateHolidayBookingInput(
  input: CreateHolidayBookingInput,
): string | undefined {
  const propertyReference = pickString(input.property_reference)
  const email = pickString(input.email)
  const forename = pickString(input.forename)
  const mobile = pickString(input.mobile)
  const arrivalDate = pickString(input.arrival)
  const departureDate = pickString(input.departure)

  if (!propertyReference || !forename || !email || !mobile || !arrivalDate || !departureDate) {
    return 'property_reference, forename, email, mobile, arrival, and departure are required'
  }

  if (!isValidEmail(email)) {
    return 'A valid email address is required'
  }

  const arrival = arrivalDateKeyToUnixSeconds(arrivalDate)
  const departure = departureDateKeyToUnixSeconds(departureDate)

  if (arrival == null || departure == null || departure <= arrival) {
    return 'Invalid arrival or departure dates'
  }

  return undefined
}

function buildCreateBookingSearchParams(input: CreateHolidayBookingInput): URLSearchParams {
  const arrival = arrivalDateKeyToUnixSeconds(pickString(input.arrival))!
  const departure = departureDateKeyToUnixSeconds(pickString(input.departure))!

  const params = new URLSearchParams({
    email: pickString(input.email),
    forename: pickString(input.forename),
    mobile: pickString(input.mobile),
    arrival: String(arrival),
    departure: String(departure),
    status: pickString(input.status) || DEFAULT_BOOKING_STATUS,
    property_reference: pickString(input.property_reference),
  })

  const surname = pickString(input.surname)
  if (surname) params.set('surname', surname)

  const fTitle = pickString(input.f_title)
  if (fTitle) params.set('f_title', fTitle)

  const guests = pickGuestCount(input.guests)
  if (guests != null) params.set('guests', String(guests))

  const message = pickString(input.message)
  if (message) params.set('message', message)

  return params
}

export async function submitHolidayBookingToOptimaCrm(
  input: CreateHolidayBookingInput,
): Promise<CreateHolidayBookingResult | CreateHolidayBookingError> {
  const validationError = validateCreateHolidayBookingInput(input)
  if (validationError) {
    return { ok: false, status: 400, message: validationError }
  }

  const params = buildCreateBookingSearchParams(input)

  try {
    const response = await getFromCRMContactWithQueryUsingUserKey(CREATE_BOOKING_ROUTE, params)
    const responseText = await response.text()

    if (!response.ok) {
      console.error('[CRM create-booking] failed', {
        status: response.status,
        body: responseText.slice(0, 500),
      })
      return {
        ok: false,
        status: response.status,
        message: `CRM booking failed (${response.status})`,
      }
    }

    let data: unknown = responseText
    try {
      data = JSON.parse(responseText) as unknown
    } catch {
      // CRM may return plain text success messages
    }

    return { ok: true, data }
  } catch (error) {
    console.error('[CRM create-booking] proxy error:', error)
    return { ok: false, status: 502, message: 'Failed to create booking enquiry' }
  }
}
