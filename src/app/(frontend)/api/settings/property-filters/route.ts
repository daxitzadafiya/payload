import { NextResponse } from 'next/server'

import { getPropertyFilterOptions } from '@/utilities/getPropertyFilterOptions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') ?? undefined

  try {
    const options = await getPropertyFilterOptions(locale ?? undefined)
    return NextResponse.json(options)
  } catch (error) {
    console.error('Property filter options error:', error)
    return NextResponse.json({ error: 'Failed to load filter options' }, { status: 500 })
  }
}
