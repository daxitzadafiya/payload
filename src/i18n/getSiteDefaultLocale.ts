import type { Payload } from 'payload'

import type { Localization } from '@/payload-types'
import { isGlobalTrashed } from '@/utilities/isGlobalTrashed'

import { defaultLocale, isLocale, type Locale } from './config'

function resolveFromGlobal(global: Localization | null): Locale {
  if (!global || isGlobalTrashed(global)) {
    return defaultLocale
  }

  const enabledLocales =
    global.languages
      ?.filter((row) => row.enabled !== false)
      .map((row) => row.locale)
      .filter((locale): locale is Locale => Boolean(locale) && isLocale(locale)) ?? []

  const configured = global.defaultLocale
  if (configured && isLocale(configured)) {
    if (enabledLocales.length === 0 || enabledLocales.includes(configured)) {
      return configured
    }
  }

  const firstEnabled = enabledLocales[0]
  if (firstEnabled) {
    return firstEnabled
  }

  return defaultLocale
}

export async function getSiteDefaultLocale(payload: Payload): Promise<Locale> {
  try {
    const global = await payload.findGlobal({
      slug: 'localization',
      depth: 0,
    })

    return resolveFromGlobal(global)
  } catch {
    return defaultLocale
  }
}
