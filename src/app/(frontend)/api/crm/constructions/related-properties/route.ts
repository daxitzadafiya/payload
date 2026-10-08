/**
 * Server proxy for Optima commercial units belonging to a construction (pedro Developments::getRelatedProjectProperties).
 *
 * POST {NestJS MODE base}/commercial_properties/commercial-construction?user={userKey}&ref={constructionRef}
 */
import { NextResponse } from 'next/server'

import { postToCRMWithUserKey } from '@/utilities/crmApi.server'
import { extractCRMList } from '@/utilities/crmProperties'
import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { getNestCrmApiBaseUrl } from '@/settings/optimaCrm/shared'

export async function POST(request: Request) {
  const settings = await getOptimaCrmSettings()
  if (!getNestCrmApiBaseUrl() || !settings.userKey.trim()) {
    return NextResponse.json(
      {
        error:
          'NestJS CRM API URL / user key is not configured in environment variables.',
      },
      { status: 500 },
    )
  }

  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const ref =
    typeof body.ref === 'string'
      ? body.ref.trim()
      : typeof body.reference === 'string'
        ? body.reference.trim()
        : ''

  if (!ref) {
    return NextResponse.json({ error: 'Missing ref' }, { status: 400 })
  }

  try {
    const queryBody = {
      options: {
        sort: {
          reference: 1,
        },
      },
      frontend: true,
      query: {
        status: ['Available'],
        similar_commercials: 'include_similar',
        has_images: true,
      },
    }

    const response = await postToCRMWithUserKey(
      'commercial_properties/commercial-construction',
      queryBody,
      undefined,
      new URLSearchParams({ ref }),
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `CRM related properties failed (${response.status})` },
        { status: response.status },
      )
    }

    const data = (await response.json()) as unknown
    let properties: Record<string, unknown>[] = []

    if (Array.isArray(data)) {
      properties = data.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === 'object' && !Array.isArray(item),
      )
    } else {
      properties = extractCRMList(data)
    }

    // commercial-construction rows are often `{ property: { … } }` — flatten for the UI parser.
    const flattened = properties.map((row) => {
      const nested = row.property
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        return { ...(nested as Record<string, unknown>), ...row, property: nested }
      }
      return row
    })

    return NextResponse.json({ properties: flattened })
  } catch (error) {
    console.error('CRM related project properties proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch related project properties' }, { status: 502 })
  }
}
