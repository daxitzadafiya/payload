/**
 * Server proxy for CRM countries list.
 */
import { NextResponse } from 'next/server'

import { postToCRM } from '@/utilities/crmApi.server'
import { unwrapCRMJsonPayload } from '@/utilities/crmCoasts'

const buildCountriesRequest = (): Record<string, unknown> => ({
  query: {},
  options: {
    page: 1,
    limit: 500,
  },
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lang = searchParams.get('lang')?.trim() || 'en'
    const crmParams = new URLSearchParams({ lang })

    const response = await postToCRM(
      'countries/find-all',
      buildCountriesRequest(),
      undefined,
      crmParams,
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `CRM countries failed (${response.status})` },
        { status: response.status },
      )
    }

    const payload = unwrapCRMJsonPayload((await response.json()) as unknown)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('CRM countries proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 502 })
  }
}
