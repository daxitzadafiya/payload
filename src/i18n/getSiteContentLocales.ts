import type { Payload } from 'payload'

import { defaultLocale, localeCodes, type Locale } from '@/i18n/locales'
import { isGlobalTrashed } from '@/utilities/isGlobalTrashed'

function isLocale(code: string): code is Locale {
  return localeCodes.includes(code as Locale)
}

/**
 * Content locales enabled on the site (Globals → Localization, "Show on site").
 */
export async function getSiteContentLocales(payload: Payload): Promise<Locale[]> {
  try {
    const global = await payload.findGlobal({
      slug: 'localization',
      depth: 0,
      overrideAccess: true,
    })

    if (isGlobalTrashed(global)) {
      return [defaultLocale]
    }

    const rows = global?.languages?.filter((row) => row.enabled !== false && row.locale) ?? []

    const fallback =
      global?.defaultLocale && isLocale(String(global.defaultLocale))
        ? (String(global.defaultLocale) as Locale)
        : defaultLocale

    if (rows.length === 0) {
      return [fallback]
    }

    const codes = rows
      .map((row) => String(row.locale).trim().toLowerCase())
      .filter(isLocale)

    return codes.length > 0 ? codes : [fallback]
  } catch {
    return [defaultLocale]
  }
}
