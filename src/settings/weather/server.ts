import {
  EMPTY_WEATHER_SETTINGS,
  resolveWeatherSettingsFromGlobal,
  type ResolvedWeatherSettings,
} from '@/settings/weather/shared'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function getWeatherSettings(): Promise<ResolvedWeatherSettings> {
  try {
    const getGlobal = getCachedGlobal('weatherSettings', 0)
    const doc = await getGlobal()
    return resolveWeatherSettingsFromGlobal(doc)
  } catch {
    return EMPTY_WEATHER_SETTINGS
  }
}

export type { ResolvedWeatherSettings } from '@/settings/weather/shared'
