import type { FlagCountry, Locale } from '@/i18n/locales'
import { defaultLocale, localeCodes } from '@/i18n/locales'

export type { FlagCountry, Locale }

export { defaultLocale, localeCodes }

// Frontend visitor content locale (separate from Payload admin UI language `payload-lng`).
export const localeCookieName = 'payload-locale'

export type LanguageMenuItem = {
  id: string
  locale: Locale
  label: string
  triggerCode: string
  flagCountry: FlagCountry
}

export function isLocale(value: string | undefined | null): value is Locale {
  return localeCodes.includes(value as Locale)
}

export function getMenuItemForLocale(
  items: LanguageMenuItem[],
  locale: Locale,
): LanguageMenuItem {
  return items.find((item) => item.locale === locale) ?? items[0]
}
