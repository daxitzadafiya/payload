'use client'

import { useEffect, useState } from 'react'

import { SITE_LOCALE_CHANGE_EVENT } from '@/i18n/localeEvents'

const readDocumentLocale = (): string => {
  if (typeof document === 'undefined') return 'en'
  return document.documentElement.lang || 'en'
}

/**
 * Tracks the active site locale from `<html lang="…">` and language-switcher events.
 * Updates immediately when the user changes language (before router.refresh completes).
 */
export function useSiteLocale(fallback = 'en'): string {
  const [locale, setLocale] = useState(() =>
    typeof document !== 'undefined' ? readDocumentLocale() : fallback,
  )

  useEffect(() => {
    const sync = () => {
      const next = readDocumentLocale()
      setLocale((prev) => (prev === next ? prev : next))
    }

    const onLocaleChange = (event: Event) => {
      const next = (event as CustomEvent<string>).detail?.trim()
      if (next) {
        setLocale((prev) => (prev === next ? prev : next))
      } else {
        sync()
      }
    }

    sync()

    window.addEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange)

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
          sync()
          break
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    })

    return () => {
      window.removeEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange)
      observer.disconnect()
    }
  }, [])

  return locale
}
