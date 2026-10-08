'use client'

import { useEffect, useState } from 'react'

import { SITE_LOCALE_CHANGE_EVENT } from '@/i18n/localeEvents'
import { useSiteLocale } from '@/utilities/useSiteLocale'

const DEFAULT_DELAY_MS = 400

/**
 * Returns the active locale only after the page has loaded and the locale has
 * been stable for a short period (initial load or language switch).
 */
export function useDeferredSiteLocale(delayMs = DEFAULT_DELAY_MS): string | null {
  const locale = useSiteLocale()
  const [pageReady, setPageReady] = useState(false)
  const [deferredLocale, setDeferredLocale] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (document.readyState === 'complete') {
      setPageReady(true)
      return
    }

    const onLoad = () => setPageReady(true)
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  useEffect(() => {
    if (!pageReady) {
      setDeferredLocale(null)
      return
    }

    setDeferredLocale(null)

    const id = window.setTimeout(() => {
      setDeferredLocale(locale)
    }, delayMs)

    return () => window.clearTimeout(id)
  }, [pageReady, locale, delayMs])

  // Re-defer when the language switcher fires before router.refresh() finishes.
  useEffect(() => {
    const onLocaleChange = () => {
      setDeferredLocale(null)
    }

    window.addEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange)
    return () => window.removeEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange)
  }, [])

  return deferredLocale
}
