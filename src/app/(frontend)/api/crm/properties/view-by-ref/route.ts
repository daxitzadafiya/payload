/**
 * Same-origin proxy for NestJS property detail.
 * GET {nestBase}/properties/view-by-ref?user=…&ref=…&status[]=…
 */
import { NextResponse } from 'next/server'

import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { getNestCrmApiBaseUrl } from '@/settings/optimaCrm/shared'
import { crmServerFetch } from '@/utilities/crmServerFetch'

export async function GET(request: Request) {
  const settings = await getOptimaCrmSettings()
  const nestBase = getNestCrmApiBaseUrl()
  const legacyBase = settings.apiUrl.trim().replace(/\/+$/, '')
  const baseUrl = nestBase || legacyBase
  const userKey = settings.userKey.trim()

  if (!baseUrl || !userKey) {
    return NextResponse.json(
      {
        error:
          'CRM property detail is not configured. Set NestJS / legacy API URL and Optima user key in environment variables.',
      },
      { status: 500 },
    )
  }

  const incoming = new URL(request.url).searchParams
  const ref = incoming.get('ref')?.trim()
  if (!ref) {
    return NextResponse.json({ error: 'Missing ref' }, { status: 400 })
  }

  const params = new URLSearchParams({
    user: userKey,
    ref,
  })

  for (const status of incoming.getAll('status[]')) {
    const trimmed = status.trim()
    if (trimmed) params.append('status[]', trimmed)
  }
  // Also accept repeated `status` from simpler clients.
  for (const status of incoming.getAll('status')) {
    const trimmed = status.trim()
    if (trimmed) params.append('status[]', trimmed)
  }

  const endpoint = `${baseUrl}/properties/view-by-ref?${params.toString()}`

  try {
    console.log('------[GET CRM PROPERTY DETAIL PROXY]------', endpoint)
    const response = await crmServerFetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return NextResponse.json(
        {
          error: `CRM property detail failed (${response.status})`,
          details: errorText.slice(0, 500),
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('CRM property detail proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch property detail' }, { status: 502 })
  }
}
