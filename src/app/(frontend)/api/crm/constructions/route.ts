/**
 * Server proxy for Yii constructions list (avoids browser CORS on contactUrl).
 * POST body: { page, pageSize, filters?, sortParams?, locale? }
 * or { searchParams: string } / { _yiiSearchParams: string }
 * Optional: { latlng: true } for map markers; { project_ids: string[] } for map-area filter.
 */
import { NextResponse } from 'next/server'

import { getFromCRMContactWithQueryUsingUserKey } from '@/utilities/crmApi.server'
import {
  buildCRMProjectsSearchParams,
  mapConstructionToPropertyRecord,
  normalizeConstructionLatLngMarkers,
  type ProjectListFilters,
} from '@/utilities/crmProjects'
import { extractCRMList, extractCRMTotal } from '@/utilities/crmProperties'
import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'

export async function POST(request: Request) {
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

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    let searchParams: URLSearchParams
    if (typeof body._yiiSearchParams === 'string' && body._yiiSearchParams.trim()) {
      searchParams = new URLSearchParams(body._yiiSearchParams)
    } else if (typeof body.searchParams === 'string' && body.searchParams.trim()) {
      searchParams = new URLSearchParams(body.searchParams)
    } else {
      searchParams = buildCRMProjectsSearchParams({
        page: Number(body.page) || 1,
        pageSize: Number(body.pageSize) || 11,
        filters: (body.filters as ProjectListFilters | undefined) ?? {},
        sortParams:
          body.sortParams && typeof body.sortParams === 'object'
            ? (body.sortParams as Record<string, unknown>)
            : undefined,
        latlng: body.latlng === true,
      })
    }

    if (body.latlng === true && !searchParams.has('latlng')) {
      searchParams.set('latlng', 'true')
    }

    const projectIds = Array.isArray(body.project_ids)
      ? body.project_ids.map((id) => String(id).trim()).filter(Boolean)
      : []

    const response = await getFromCRMContactWithQueryUsingUserKey(
      'constructions',
      searchParams,
      projectIds.length
        ? {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_ids: projectIds }),
          }
        : undefined,
    )
    if (!response.ok) {
      return NextResponse.json(
        { error: `CRM constructions API failed (${response.status})` },
        { status: response.status },
      )
    }

    const locale = typeof body.locale === 'string' ? body.locale : 'en'
    const data = (await response.json()) as unknown
    const isLatLng =
      body.latlng === true || searchParams.get('latlng') === 'true'

    if (isLatLng) {
      const markers = normalizeConstructionLatLngMarkers(data)
      return NextResponse.json({
        constructions: markers,
        properties: markers,
        markers,
        total: markers.length,
        totalDocs: markers.length,
      })
    }

    const list = extractCRMList(data).map((row) => mapConstructionToPropertyRecord(row, locale))
    const total = extractCRMTotal(data, list.length)

    return NextResponse.json({
      constructions: list,
      properties: list,
      total,
      totalDocs: total,
    })
  } catch (error) {
    console.error('CRM constructions proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch constructions' }, { status: 502 })
  }
}
