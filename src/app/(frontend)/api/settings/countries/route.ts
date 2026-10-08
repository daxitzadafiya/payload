import { NextResponse } from 'next/server'

import { getSiteCountries } from '@/utilities/getSiteCountries'
import type { SiteCountryTransaction } from '@/utilities/siteCountries.shared'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale')?.trim() || 'en'
  const transactionParam = searchParams.get('transaction')?.trim().toLowerCase()

  const transaction: SiteCountryTransaction =
    transactionParam === 'rental'
      ? 'rental'
      : transactionParam === 'holiday'
        ? 'holiday'
        : 'sale'

  try {
    const countries = await getSiteCountries(locale, transaction)
    return NextResponse.json(countries)
  } catch (error) {
    console.error('Site countries error:', error)
    return NextResponse.json({ error: 'Failed to load countries' }, { status: 500 })
  }
}
