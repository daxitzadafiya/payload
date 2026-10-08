import { cookies } from 'next/headers'

import { defaultLocale, isLocale, localeCookieName, type Locale } from './config'

/**
 * Resolve the visitor locale.
 * 1. Valid cookie (and allowed by menu when provided)
 * 2. Preferred CMS default when it is in the menu
 * 3. First menu locale
 * 4. Hardcoded schema fallback (`en`)
 */
export async function getLocale(
  menuLocales?: Locale[],
  preferredDefault: Locale = defaultLocale,
): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get(localeCookieName)?.value

  if (isLocale(value)) {
    if (!menuLocales || menuLocales.length === 0 || menuLocales.includes(value)) {
      return value
    }
  }

  if (menuLocales && menuLocales.length > 0) {
    if (menuLocales.includes(preferredDefault)) {
      return preferredDefault
    }
    return menuLocales[0]
  }

  return preferredDefault
}
