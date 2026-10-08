import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { syncCountriesFromCRM } from '@/utilities/syncCountriesFromCRM'

export async function POST() {
  try {
    const payload = await getPayload({ config: configPromise })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await syncCountriesFromCRM(payload)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Countries sync error:', error)
    const message = error instanceof Error ? error.message : 'Failed to sync countries'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
