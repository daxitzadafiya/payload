import { NextResponse } from 'next/server'

import { getCachedWeather } from '@/utilities/weather/getWeather'

export async function GET() {
  try {
    const weather = await getCachedWeather()

    if (!weather) {
      return NextResponse.json({ enabled: false, weather: null })
    }

    return NextResponse.json(
      { enabled: true, weather },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${weather.refreshIntervalMinutes * 60}, stale-while-revalidate=60`,
        },
      },
    )
  } catch (error) {
    console.error('Weather route error:', error)
    return NextResponse.json({ enabled: false, weather: null }, { status: 500 })
  }
}
