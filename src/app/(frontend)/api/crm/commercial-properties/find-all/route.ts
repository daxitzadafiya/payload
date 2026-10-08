/**
 * Same-origin proxy for NestJS property map markers.
 * Avoids browser CORS for commercial_properties/find-all.
 */
import { NextResponse } from 'next/server'

import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { getNestCrmApiBaseUrl } from '@/settings/optimaCrm/shared'
import { postToCRMWithUserKey } from '@/utilities/crmApi.server'

export async function POST(request: Request) {
  const settings = await getOptimaCrmSettings()
  if (!getNestCrmApiBaseUrl() || !settings.userKey.trim()) {
    return NextResponse.json(
      { error: 'NestJS CRM API URL / user key is not configured in environment variables.' },
      { status: 500 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const response = await postToCRMWithUserKey(
      'commercial_properties/find-all',
      body,
      undefined,
      new URLSearchParams({
        latLang: '1',
        selectedFields: '1',
      }),
    )

    if (!response.ok) {
      const details = await response.text().catch(() => '')
      return NextResponse.json(
        {
          error: `CRM map API failed (${response.status})`,
          details: details.slice(0, 500),
        },
        { status: response.status },
      )
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('CRM map proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch CRM map properties' }, { status: 502 })
  }
}
