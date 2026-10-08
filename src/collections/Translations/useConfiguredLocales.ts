'use client'

import { useConfig } from '@payloadcms/ui'
import { useMemo } from 'react'

import { cmsLocales } from '@/i18n/locales'

export type ConfiguredLocale = {
  code: string
  label: string
}

const fallbackLocales: ConfiguredLocale[] = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
]

/**
 * Locales enabled in Globals → Localization (same set as the admin “Locale” menu).
 */
export function useConfiguredLocales(): ConfiguredLocale[] {
  const { config } = useConfig()

  return useMemo(() => {
    const localization = config.localization
    const locales =
      localization && typeof localization === 'object' ? (localization.locales ?? []) : []

    if (locales.length === 0) {
      return fallbackLocales
    }

    return locales.map((locale) => {
      const label =
        typeof locale.label === 'string'
          ? locale.label
          : (cmsLocales.find((entry) => entry.code === locale.code)?.label ?? locale.code)

      return { code: locale.code, label }
    })
  }, [config.localization])
}
