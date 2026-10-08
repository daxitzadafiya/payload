/**
 * Server proxy for Yii constructions/view-by-ref.
 *
 * https://…/index.php?r=constructions/view-by-ref&user=…&ref=…&status[]=Available&model=commercial&similar_commercials=exclude_similar
 */
import { NextResponse } from 'next/server'

import { getFromCRMContactWithQueryUsingUserKey } from '@/utilities/crmApi.server'
import { mapConstructionToPropertyRecord } from '@/utilities/crmProjects'
import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'

export async function GET(request: Request) {
  const settings = await getOptimaCrmSettings()
  if (!settings.contactUrl.trim() || !settings.userKey.trim()) {
    return NextResponse.json(
      {
        error:
          'CRM Yii contact URL / user key is not configured. Set credentials under Globals → Optima CRM.',
      },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')?.trim()
  if (!ref) {
    return NextResponse.json({ error: 'Missing ref' }, { status: 400 })
  }

  const locale = searchParams.get('locale')?.trim() || 'en'
  const similarCommercials =
    searchParams.get('similar_commercials')?.trim() ||
    settings.similarCommercials ||
    'exclude_similar'

  try {
    const params = new URLSearchParams({
      ref,
      model: 'commercial',
      similar_commercials: similarCommercials,
    })
    // Yii expects status[]=Available (array form), not a plain status= string.
    params.append('status[]', 'Available')

    const response = await getFromCRMContactWithQueryUsingUserKey(
      'constructions/view-by-ref',
      params,
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `CRM project detail failed (${response.status})` },
        { status: response.status },
      )
    }

    const data = (await response.json()) as unknown
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid CRM response' }, { status: 502 })
    }

    const mapped = mapConstructionToPropertyRecord(data as Record<string, unknown>, locale)
    if (mapped.reference == null && !mapped._id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Keep top-level attachments / raw payload fields available for video/energy helpers.
    return NextResponse.json({
      ...mapped,
      _raw: data,
    })
  } catch (error) {
    console.error('CRM project detail proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch project detail' }, { status: 502 })
  }
}
