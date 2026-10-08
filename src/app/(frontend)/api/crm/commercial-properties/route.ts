/**
 * Same-origin proxy for NestJS property listings.
 * Avoids browser CORS when Search (client) calls properties / commercial_properties.
 */
import { NextResponse } from 'next/server'

import { getCRMConfig, getFromCRM, postToCRM } from '@/utilities/crmApi.server'

export async function GET(request: Request) {
  const config = await getCRMConfig()

  if (!config) {
    return NextResponse.json(
      {
        error:
          'CRM API is not configured. Set Optima CRM credentials in environment variables.',
      },
      { status: 500 },
    )
  }

  try {
    const searchParams = new URL(request.url).searchParams
    const response = await getFromCRM('properties', searchParams)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return NextResponse.json(
        { error: `CRM API failed (${response.status})`, details: errorText.slice(0, 500) },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('CRM properties GET proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const config = await getCRMConfig()

  if (!config) {
    return NextResponse.json(
      {
        error:
          'CRM API is not configured. Set Optima CRM credentials in environment variables.',
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
    const response = await postToCRM('commercial_properties', body)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return NextResponse.json(
        {
          error: `CRM commercial_properties API failed (${response.status})`,
          details: errorText.slice(0, 500),
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('CRM commercial_properties POST proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 502 })
  }
}
