/**
 * Server proxy for Optima CRM `properties/calculate-rental-price`.
 * Keeps `user_apikey` on the server — browser only sends property + dates.
 */
import { NextResponse } from 'next/server'

import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { calculateHolidayRentalPriceFromOptimaCrm } from '@/utilities/calculateHolidayRentalPriceFromOptimaCrm'

export async function GET(request: Request) {
  const settings = await getOptimaCrmSettings()
  const contactUrl = settings.contactUrl.trim()
  const apiKey = settings.apiKey.trim()

  if (!contactUrl || !apiKey) {
    return NextResponse.json(
      {
        error:
          'CRM rental price API is not configured. Set contact URL and API key under Globals → Optima CRM.',
      },
      { status: 500 },
    )
  }

  const incoming = new URL(request.url).searchParams
  const property = incoming.get('property')?.trim() ?? ''
  const from = incoming.get('from')?.trim() ?? ''
  const to = incoming.get('to')?.trim() ?? ''

  const result = await calculateHolidayRentalPriceFromOptimaCrm({ property, from, to })

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  return NextResponse.json({
    short_term_rental_price: result.shortTermRentalPrice,
    short_term_rental: result.shortTermRental,
  })
}
