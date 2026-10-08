import type { WeatherSetting } from '@/payload-types'

export type ResolvedWeatherSettings = {
  enabled: boolean
  baseUrl: string
  apiKey: string
  location: string
  cacheIntervalMinutes: number
}

export const DEFAULT_WEATHER_BASE_URL = 'https://api.weatherapi.com/v1/current.json'

export const EMPTY_WEATHER_SETTINGS: ResolvedWeatherSettings = {
  enabled: false,
  baseUrl: DEFAULT_WEATHER_BASE_URL,
  apiKey: '',
  location: 'Javea',
  cacheIntervalMinutes: 5,
}

function pickString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

function pickNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

export function resolveWeatherSettingsFromGlobal(
  doc: WeatherSetting | null | undefined,
): ResolvedWeatherSettings {
  const defaults = EMPTY_WEATHER_SETTINGS

  return {
    enabled: Boolean(doc?.enabled),
    baseUrl: pickString(doc?.baseUrl, defaults.baseUrl),
    apiKey: pickString(doc?.apiKey, defaults.apiKey),
    location: pickString(doc?.location, defaults.location),
    cacheIntervalMinutes: pickNumber(
      doc?.cacheIntervalMinutes,
      defaults.cacheIntervalMinutes,
      1,
      120,
    ),
  }
}
