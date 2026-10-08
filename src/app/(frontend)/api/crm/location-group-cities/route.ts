/**
 * Server proxy for cities within selected location groups (coasts).
 */
import { NextResponse } from 'next/server'

import { postToCRMWithUserKey } from '@/utilities/crmApi.server'
import { unwrapCRMJsonPayload } from '@/utilities/crmCoasts'
import type { CRMListingPreset } from '@/utilities/crmProperties'
import { getActiveLocale } from '@/i18n/getLanguageMenu'

type RequestBody = {
  locationGroup?: number[]
  preset?: CRMListingPreset
}

export async function POST(request: Request) {
  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const locationGroup = (body.locationGroup ?? []).filter(
    (key) => typeof key === 'number' && Number.isFinite(key),
  )

  if (!locationGroup.length) {
    return NextResponse.json({ docs: [], total: 0 })
  }

  const preset = body.preset ?? 'forSale'
  const { locale } = await getActiveLocale()
  const propStatus =
    preset === 'sold' ? (['Sold'] as const) : (['Available', 'Under Offer'] as const)

  const query: Record<string, unknown> = {
    sort: locale === 'es' ? 'es_AR' : locale,
    order: 'DESC',
    prop_status: propStatus,
    allow_cities: true,
    frontend_api: true,
    location_group: locationGroup,
  }

  // if (preset === 'forRent') {
  //   query.rent = true
  //   query.lt_rental = true
  // } else if (preset === 'forHoliday') {
  //   query.rent = true
  //   query.st_rental = true
  // } else if (preset !== 'sold') {
  //   query.sale = true
  // }

  const requestBody = { query }
  try {
    const response = await postToCRMWithUserKey(
      'locationgroups/get-location-groups-with-properties',
      requestBody,
    )

    console.log('BODY >>>>', requestBody)

    if (!response.ok) {
      return NextResponse.json(
        { error: `CRM cities failed (${response.status})` },
        { status: response.status },
      )
    }

    const payload = unwrapCRMJsonPayload((await response.json()) as unknown)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('CRM location group cities proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 502 })
  }
}
