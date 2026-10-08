export const SITE_LOCALE_CHANGE_EVENT = 'site-locale-change'

export function dispatchSiteLocaleChange(locale: string): void {
  if (typeof window === 'undefined') return

  document.documentElement.lang = locale
  window.dispatchEvent(new CustomEvent<string>(SITE_LOCALE_CHANGE_EVENT, { detail: locale }))
}
