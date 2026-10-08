/**
 * CMS content locales — registered in the database schema.
 *
 * To support a new language in the CMS:
 * 1. Add `{ code, label }` below
 * 2. Restart dev / accept schema push, then `pnpm generate:types`
 * 3. Globals → Localization → Add Language → pick that Content locale
 *
 * The admin "Locale" menu only shows languages added in Globals → Localization
 * (see filterAdminLocales).
 */
import type { LocalizationConfigWithLabels } from 'payload'

export const cmsLocales = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
  { code: 'el', label: 'Greek' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'fi', label: 'Finnish' },
] as const

export type Locale = (typeof cmsLocales)[number]['code']

export const defaultLocale: Locale = 'en'

export const localeCodes: Locale[] = cmsLocales.map((l) => l.code)

export const payloadLocalization: LocalizationConfigWithLabels = {
  locales: cmsLocales.map(({ code, label }) => ({ code, label })),
  defaultLocale,
  fallback: true,
  // Lazy import avoids a circular init cycle:
  // locales → filterAdminLocales → adminLanguageLabels → adminLanguagePacks → locales
  filterAvailableLocales: (args) =>
    import('./filterAdminLocales').then(({ filterAdminLocales }) => filterAdminLocales(args)),
}

/** Flag icons available in the language switcher (Globals → Localization) */
export const flagCountryOptions = [
  { label: 'United Kingdom', value: 'gb' },
  { label: 'United States', value: 'us' },
  { label: 'Germany', value: 'de' },
  { label: 'France', value: 'fr' },
  { label: 'Spain', value: 'es' },
  { label: 'Greece', value: 'gr' },
  { label: 'Italy', value: 'it' },
  { label: 'Netherlands', value: 'nl' },
  { label: 'Finland', value: 'fi' },
] as const

export type FlagCountry = (typeof flagCountryOptions)[number]['value']

export function getCmsLocaleLabel(code: string): string {
  return cmsLocales.find((l) => l.code === code)?.label ?? code
}
