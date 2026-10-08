import { cache } from 'react'

import type { Localization } from '@/payload-types'

import { getCachedGlobal } from '@/utilities/getGlobals'

import { isLocale, type LanguageMenuItem } from './config'
import { getLocale } from './getLocale'
import { defaultLocale, type FlagCountry, type Locale } from './locales'

const fallbackMenu: LanguageMenuItem[] = [
  {
    id: 'en',
    locale: 'en',
    label: 'English',
    triggerCode: 'EN',
    flagCountry: 'gb',
  },
  {
    id: 'de',
    locale: 'de',
    label: 'Deutsch',
    triggerCode: 'DE',
    flagCountry: 'de',
  },
]

function mapGlobalToMenu(global: Localization | null): LanguageMenuItem[] {
  const rows = global?.languages?.filter((row) => row.enabled !== false) ?? []

  if (rows.length === 0) {
    return fallbackMenu
  }

  return rows
    .map((row, index) => {
      if (!row?.locale || !isLocale(row.locale) || !row.label || !row.shortCode || !row.flag) {
        return null
      }

      return {
        id: row.id ?? `${row.locale}-${index}`,
        locale: row.locale as Locale,
        label: row.label,
        triggerCode: row.shortCode,
        flagCountry: row.flag as FlagCountry,
      }
    })
    .filter((item): item is LanguageMenuItem => item !== null)
}

function resolveSiteDefaultLocale(
  global: Localization | null,
  items: LanguageMenuItem[],
): Locale {
  const configured = global?.defaultLocale
  if (configured && isLocale(configured) && items.some((item) => item.locale === configured)) {
    return configured
  }

  return items[0]?.locale ?? defaultLocale
}

export const getLanguageMenuItems = cache(async (): Promise<LanguageMenuItem[]> => {
  const provisional = await getLocale()
  const global = await getCachedGlobal('localization', 0, provisional)()
  const items = mapGlobalToMenu(global)

  return items.length > 0 ? items : fallbackMenu
})

export function resolveActiveLocale(
  currentLocale: Locale,
  items: LanguageMenuItem[],
  preferredDefault: Locale = defaultLocale,
): Locale {
  if (items.some((item) => item.locale === currentLocale)) {
    return currentLocale
  }

  if (items.some((item) => item.locale === preferredDefault)) {
    return preferredDefault
  }

  return items[0]?.locale ?? preferredDefault
}

export const getActiveLocale = cache(async (): Promise<{
  locale: Locale
  languageMenu: LanguageMenuItem[]
  siteDefaultLocale: Locale
}> => {
  const provisional = await getLocale()
  let global = await getCachedGlobal('localization', 0, provisional)()
  let mapped = mapGlobalToMenu(global)
  let languageMenu = mapped.length > 0 ? mapped : fallbackMenu
  const siteDefaultLocale = resolveSiteDefaultLocale(global, languageMenu)
  const menuLocales = languageMenu.map((item) => item.locale)
  const cookieLocale = await getLocale(menuLocales, siteDefaultLocale)
  const locale = resolveActiveLocale(cookieLocale, languageMenu, siteDefaultLocale)

  if (locale !== provisional) {
    global = await getCachedGlobal('localization', 0, locale)()
    mapped = mapGlobalToMenu(global)
    languageMenu = mapped.length > 0 ? mapped : fallbackMenu
  }

  return {
    languageMenu,
    siteDefaultLocale,
    locale,
  }
})
