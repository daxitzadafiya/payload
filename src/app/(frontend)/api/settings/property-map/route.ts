import { NextResponse } from 'next/server'

import { getPropertyMapSettings } from '@/utilities/getPropertyMapSettings'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') ?? undefined

  try {
    const settings = await getPropertyMapSettings(locale ?? undefined)
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Property map settings error:', error)
    return NextResponse.json({ error: 'Failed to load map settings' }, { status: 500 })
  }
}
