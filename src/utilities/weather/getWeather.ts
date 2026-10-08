import { getWeatherSettings } from '@/settings/weather/server'
import {
  getStaleWeather,
  getStoredWeather,
  storeWeather,
} from '@/utilities/weather/cache'
import type { PublicWeather, WeatherApiResponse } from '@/utilities/weather/types'

function buildCacheKey(settings: {
  baseUrl: string
  apiKey: string
  location: string
}): string {
  return `${settings.baseUrl}|${settings.apiKey}|${settings.location}`
}

function normalizeIconUrl(icon: string | undefined): string {
  if (!icon) return ''
  if (icon.startsWith('//')) return `https:${icon}`
  return icon
}

function mapWeatherResponse(
  payload: WeatherApiResponse,
  refreshIntervalMinutes: number,
  cachedAt: string,
): PublicWeather | null {
  const locationName = payload.location?.name?.trim()
  const temperatureC = payload.current?.temp_c

  if (!locationName || typeof temperatureC !== 'number') return null

  return {
    locationName,
    country: payload.location?.country?.trim() ?? '',
    temperatureC: Math.round(temperatureC),
    conditionText: payload.current?.condition?.text?.trim() ?? '',
    conditionIcon: normalizeIconUrl(payload.current?.condition?.icon),
    cachedAt,
    refreshIntervalMinutes,
  }
}

async function fetchWeatherFromApi(settings: {
  baseUrl: string
  apiKey: string
  location: string
  cacheIntervalMinutes: number
}): Promise<PublicWeather | null> {
  const url = new URL(settings.baseUrl)
  url.searchParams.set('key', settings.apiKey)
  url.searchParams.set('q', settings.location)

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    next: { revalidate: settings.cacheIntervalMinutes * 60 },
  })

  if (!response.ok) {
    console.error('Weather API error:', response.status, await response.text())
    return null
  }

  const payload = (await response.json()) as WeatherApiResponse
  const cachedAt = new Date().toISOString()

  return mapWeatherResponse(payload, settings.cacheIntervalMinutes, cachedAt)
}

export async function getCachedWeather(): Promise<PublicWeather | null> {
  const settings = await getWeatherSettings()

  if (!settings.enabled || !settings.apiKey) return null

  const cacheKey = buildCacheKey(settings)
  const maxAgeMs = settings.cacheIntervalMinutes * 60 * 1000
  const cached = getStoredWeather(cacheKey, maxAgeMs)

  if (cached) return cached

  try {
    const fresh = await fetchWeatherFromApi(settings)
    if (fresh) {
      storeWeather(cacheKey, fresh)
      return fresh
    }
  } catch (error) {
    console.error('Weather fetch failed:', error)
  }

  return getStaleWeather(cacheKey)
}
