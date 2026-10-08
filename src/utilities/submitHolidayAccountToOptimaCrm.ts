import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { crmServerFetch } from '@/utilities/crmServerFetch'

import type { CreateHolidayBookingInput } from '@/utilities/submitHolidayBookingToOptimaCrm'

type SubmitHolidayAccountResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; message: string }

const pickString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : ''

const pickGuestCount = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }
  const parsed = parseInt(pickString(value).replace(/\D/g, ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const parseResponse = async (response: Response): Promise<unknown> => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

const buildAccountsEndpoint = (contactUrl: string, userKey: string): string => {
  const base = contactUrl.replace(/\/+$/, '')
  const joiner = base.includes('?') ? '&' : '?'
  return `${base}${joiner}r=accounts&user=${encodeURIComponent(userKey)}`
}

export async function submitHolidayAccountToOptimaCrm(
  input: CreateHolidayBookingInput,
): Promise<SubmitHolidayAccountResult> {
  const settings = await getOptimaCrmSettings()
  const contactUrl = settings.contactUrl.trim()
  const userKey = settings.userKey.trim()

  if (!contactUrl || !userKey) {
    return {
      ok: false,
      status: 500,
      message: 'CRM account API is not configured. Set contact URL and user key.',
    }
  }

  const endpoint = buildAccountsEndpoint(contactUrl, userKey)

  const payload: Record<string, unknown> = {
    forename: pickString(input.forename),
    surname: pickString(input.surname),
    email: pickString(input.email),
    phone: pickString(input.mobile),
    message: pickString(input.message),
    property: pickString(input.property_reference),
    rent_from_date: pickString(input.arrival),
    rent_to_date: pickString(input.departure),
    transaction_types: 'short term rental',
    only_holiday_homes: true,
    source: 'web-client',
    lead_status: '1001',
    language: 'EN',
    newsletter: false,
  }

  const minSleeps = pickGuestCount(input.guests)
  if (minSleeps != null) payload.min_sleeps = minSleeps

  try {
    const response = await crmServerFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    const data = await parseResponse(response)

    if (!response.ok) {
      console.error('[CRM accounts] failed', { status: response.status, data })
      return {
        ok: false,
        status: response.status,
        message: `CRM account creation failed (${response.status})`,
      }
    }

    return { ok: true, data }
  } catch (error) {
    console.error('[CRM accounts] proxy error:', error)
    return { ok: false, status: 502, message: 'Failed to create CRM account' }
  }
}
