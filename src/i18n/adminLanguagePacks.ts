import type { Language } from '@payloadcms/translations'
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import { fr } from '@payloadcms/translations/languages/fr'
import { it } from '@payloadcms/translations/languages/it'
import { nl } from '@payloadcms/translations/languages/nl'

import { getCmsLocaleLabel } from '@/i18n/locales'

/**
 * Payload admin UI language packs available for Account → Language.
 * Only codes that exist here can appear in that dropdown (built-in UI chrome).
 * Content locales without a pack (e.g. `el`) still work for Locale / frontend.
 *
 * Labels use English CMS names (German, Spanish, …) — Payload defaults are native
 * forms (Deutsch, Español) via `translations.general.thisLanguage`.
 */
export function withLanguageLabel(pack: Language, label: string): Language {
  return {
    ...pack,
    translations: {
      ...pack.translations,
      general: {
        ...pack.translations.general,
        thisLanguage: label,
      },
    },
  } as Language
}

function pack(code: string, language: Language): Language {
  return withLanguageLabel(language, getCmsLocaleLabel(code))
}

export const adminLanguagePacks = {
  en: pack('en', en),
  de: pack('de', de),
  es: pack('es', es),
  fr: pack('fr', fr),
  it: pack('it', it),
  nl: pack('nl', nl),
} as const satisfies Record<string, Language>

export type AdminLanguageCode = keyof typeof adminLanguagePacks

export function isAdminLanguageCode(code: string): code is AdminLanguageCode {
  return Object.prototype.hasOwnProperty.call(adminLanguagePacks, code)
}

/** Narrow helper for typing supportedLanguages keys. */
export type AdminSupportedLanguages = Partial<typeof adminLanguagePacks> & {
  en: (typeof adminLanguagePacks)['en']
}
