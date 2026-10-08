'use client'

import { useEffect, useState } from 'react'

import type { PropertyMapSettings } from '@/utilities/getPropertyMapSettings'
import { useSiteLocale } from '@/utilities/useSiteLocale'
import { SITE_THEME_TOKEN_DEFAULTS } from '@/globals/Theme/siteThemeTokens.mjs'

const DEFAULT_SETTINGS: PropertyMapSettings = {
  modalTitle: 'Property Map',
  defaultCenter: { lat: 38.3452, lng: -0.481 },
  defaultZoom: 8,
  minZoom: 5,
  maxZoom: 18,
  enableDrawSearch: true,
  drawInstructionText: 'Draw A Shape Around The Region(S) You Would Like To Search',
  drawButtonLabel: 'Draw your area on the map',
  clusterColors: {
    small: SITE_THEME_TOKEN_DEFAULTS.primary,
    medium: SITE_THEME_TOKEN_DEFAULTS.primary,
    large: SITE_THEME_TOKEN_DEFAULTS.primary,
  },
  mapFetchLimit: 5000,
}

export function usePropertyMapSettings() {
  const locale = useSiteLocale()
  const [settings, setSettings] = useState<PropertyMapSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (locale) params.set('locale', locale)

        const response = await fetch(`/api/settings/property-map?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error('Failed to load map settings')

        const data = (await response.json()) as PropertyMapSettings
        setSettings(data)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to load property map settings', error)
          setSettings(DEFAULT_SETTINGS)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [locale])

  return { settings, loading }
}
