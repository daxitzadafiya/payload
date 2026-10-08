import { localeCodes, type Locale } from '@/i18n/locales'

function isLocale(code: string): code is Locale {
  return localeCodes.includes(code as Locale)
}

/**
 * Site locales minus the source, optionally intersected with an explicit filter
 * (used when Localization enables a subset of languages to backfill).
 */
export function resolveTargetLocales(
  siteLocales: readonly string[],
  sourceLocale: string,
  filter?: readonly string[],
): Locale[] {
  const normalizedSource = sourceLocale.trim().toLowerCase()
  const base = siteLocales
    .map((code) => code.trim().toLowerCase())
    .filter((code) => code !== normalizedSource)
    .filter(isLocale)

  if (!filter?.length) return base

  const allowed = new Set(filter.map((code) => code.trim().toLowerCase()))
  return base.filter((code) => allowed.has(code))
}
