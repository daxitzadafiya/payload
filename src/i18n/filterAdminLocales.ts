import type { LocalizationConfigWithLabels, PayloadRequest } from 'payload'

import {
  applyAccountLanguageOptionLabels,
  isLabelRecord,
  type LocalizationLanguageRow,
} from '@/i18n/adminLanguageLabels'
import { defaultLocale } from '@/i18n/locales'

type PayloadLocale = LocalizationConfigWithLabels['locales'][number]

const fallbackCodes = ['en', 'de'] as const

/**
 * Limits the Payload admin "Locale" menu to languages saved in Globals → Localization
 * (with "Show on site" enabled).
 *
 * Display names are loaded for all locales so Payload's Localizer can pick the
 * label from Account → Language (profile / `req.i18n.language`) via getTranslation.
 *
 * Also refreshes Account → Language dropdown labels for the current profile language.
 */
export async function filterAdminLocales({
  locales,
  req,
}: {
  locales: PayloadLocale[]
  req: PayloadRequest
}): Promise<PayloadLocale[]> {
  try {
    const global = await req.payload.findGlobal({
      slug: 'localization',
      depth: 0,
      locale: 'all',
      overrideAccess: true,
    })

    const rows = ((global?.languages ?? []) as LocalizationLanguageRow[]).filter(
      (row) => row.enabled !== false && row.locale,
    )

    if (rows.length === 0) {
      return locales.filter((locale) => fallbackCodes.includes(locale.code as 'en' | 'de'))
    }

    const uiLanguage =
      typeof req.i18n?.language === 'string' && req.i18n.language.trim()
        ? req.i18n.language.trim().toLowerCase()
        : defaultLocale

    applyAccountLanguageOptionLabels(req.payload, rows, uiLanguage)

    const codes = new Set(rows.map((row) => String(row.locale)))

    const filtered = locales
      .filter((locale) => codes.has(locale.code))
      .map((locale) => {
        const row = rows.find((r) => r.locale === locale.code)
        if (!row?.label) return locale

        if (isLabelRecord(row.label)) {
          return { ...locale, label: row.label }
        }

        if (typeof row.label === 'string' && row.label.trim()) {
          return { ...locale, label: row.label }
        }

        return locale
      })

    if (filtered.length > 0) {
      return filtered
    }

    const defaultEntry = locales.find((locale) => locale.code === defaultLocale)
    return defaultEntry ? [defaultEntry] : locales.slice(0, 1)
  } catch {
    return locales.filter((locale) => fallbackCodes.includes(locale.code as 'en' | 'de'))
  }
}
