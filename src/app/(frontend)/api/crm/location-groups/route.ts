/**
 * Server proxy for Yii location groups (coasts). Avoids browser CORS on the contact URL.
 * Optional `country` query (CRM key, e.g. `?country=1`) scopes coasts to that country.
 */
import { NextResponse } from 'next/server'

import { getFromCRMContactWithQuery } from '@/utilities/crmApi.server'
import { unwrapCRMJsonPayload } from '@/utilities/crmCoasts'

const LOCATION_GROUPS_ROUTE = 'properties/location-groups-key-value'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')?.trim()
    const crmParams = new URLSearchParams()
    if (country) crmParams.set('country', country)

    const response = await getFromCRMContactWithQuery(LOCATION_GROUPS_ROUTE, crmParams)

    if (!response.ok) {
      return NextResponse.json(
        { error: `CRM location groups failed (${response.status})` },
        { status: response.status },
      )
    }

    const payload = unwrapCRMJsonPayload((await response.json()) as unknown)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('CRM location groups proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch location groups' }, { status: 502 })
  }
}
