import { NextResponse } from 'next/server'

import { postToCRM } from '@/utilities/crmApi.server'

export async function POST(request: Request) {
  let body: Record<string, unknown>

  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const response = await postToCRM('commercial_types', body)

    if (!response.ok) {
      const details = await response.text().catch(() => '')
      return NextResponse.json(
        {
          error: `CRM commercial types failed (${response.status})`,
          details: details.slice(0, 500),
        },
        { status: response.status },
      )
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('CRM commercial types proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CRM commercial types' },
      { status: 502 },
    )
  }
}
