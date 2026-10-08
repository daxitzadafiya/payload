import type { PublicWeather } from '@/utilities/weather/types'

type WeatherCacheEntry = {
  data: PublicWeather
  cachedAt: number
  cacheKey: string
}

let weatherCache: WeatherCacheEntry | null = null

export function invalidateWeatherCache(): void {
  weatherCache = null
}

export function getStoredWeather(cacheKey: string, maxAgeMs: number): PublicWeather | null {
  if (!weatherCache || weatherCache.cacheKey !== cacheKey) return null
  if (Date.now() - weatherCache.cachedAt >= maxAgeMs) return null
  return weatherCache.data
}

export function storeWeather(cacheKey: string, data: PublicWeather): void {
  weatherCache = {
    data,
    cachedAt: Date.now(),
    cacheKey,
  }
}

export function getStaleWeather(cacheKey: string): PublicWeather | null {
  if (!weatherCache || weatherCache.cacheKey !== cacheKey) return null
  return weatherCache.data
}
