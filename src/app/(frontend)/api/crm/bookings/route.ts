/**
 * Server proxy for Optima CRM `bookings/create-booking` (holiday rental enquiries).
 */
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { sendHolidayBookingNotificationEmail } from '@/email/sendNotificationEmail'
import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { getIntegrationsSettings } from '@/settings/integrations/server'
import { verifyRecaptchaToken } from '@/utilities/verifyRecaptcha'
import {
  submitHolidayBookingToOptimaCrm,
  type CreateHolidayBookingInput,
} from '@/utilities/submitHolidayBookingToOptimaCrm'

export async function POST(request: Request) {
  let body: CreateHolidayBookingInput & {
    locale?: string
    price?: number | string
    display_reference?: string
  }
  try {
    body = (await request.json()) as CreateHolidayBookingInput & {
      locale?: string
      price?: number | string
      display_reference?: string
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const settings = await getOptimaCrmSettings()
  const contactUrl = settings.contactUrl.trim()

  if (!contactUrl || !settings.userKey?.trim()) {
    return NextResponse.json(
      {
        error:
          'CRM booking API is not configured. Set contact URL and user key under Globals → Optima CRM.',
      },
      { status: 500 },
    )
  }

  // Terms acceptance is always required before submitting.
  if (body.terms_accepted !== true) {
    return NextResponse.json(
      { error: 'Please accept the privacy policy and terms before submitting.' },
      { status: 400 },
    )
  }

  // If reCAPTCHA is configured server-side, verify it before any CRM calls.
  const integrations = await getIntegrationsSettings()
  const recaptchaSecret = integrations.recaptchaSecretKey.trim()
  if (recaptchaSecret) {
    const token = typeof body.recaptchaToken === 'string' ? body.recaptchaToken.trim() : ''
    if (!token) {
      return NextResponse.json(
        { error: 'Please complete the reCAPTCHA verification.' },
        { status: 400 },
      )
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const remoteip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : undefined
    const ok = await verifyRecaptchaToken({ token, remoteip })
    if (!ok) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed. Please try again.' },
        { status: 400 },
      )
    }
  }

  // These restriction fields are only for our server-side gatekeeping / email display.
  // They must not be forwarded to Optima CRM.
  const {
    terms_accepted: _termsAccepted,
    recaptchaToken: _recaptchaToken,
    locale: submissionLocale,
    price: submissionPrice,
    display_reference: submissionDisplayReference,
    ...crmBody
  } = body

  // NOTE: Currently we skip Optima account/lead creation
  // and create only the booking record.
  const result = await submitHolidayBookingToOptimaCrm(crmBody)

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  try {
    const payload = await getPayload({ config: configPromise })
    await sendHolidayBookingNotificationEmail({
      payload,
      input: {
        property_reference: crmBody.property_reference,
        display_reference:
          typeof submissionDisplayReference === 'string'
            ? submissionDisplayReference
            : undefined,
        forename: crmBody.forename,
        surname: crmBody.surname,
        email: crmBody.email,
        mobile: crmBody.mobile,
        arrival: crmBody.arrival,
        departure: crmBody.departure,
        guests: crmBody.guests,
        message: crmBody.message,
        locale: typeof submissionLocale === 'string' ? submissionLocale : undefined,
        price: submissionPrice,
      },
    })
  } catch (error) {
    console.error('[CRM create-booking] email notification failed', error)
  }

  return NextResponse.json({
    success: true,
    data: {
      booking: result.data,
    },
  })
}
