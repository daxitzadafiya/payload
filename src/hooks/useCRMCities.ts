'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  fetchCRMCities,
  resolveLocationGroupKeys,
  type CRMCityOption,
  type CRMCoastOption,
} from '@/utilities/crmCoasts'
import type { CRMListingPreset } from '@/utilities/crmProperties'
import { useSiteLocale } from '@/utilities/useSiteLocale'

export function useCRMCities(
  coast: string[] | undefined,
  coasts: CRMCoastOption[],
  listingPreset: CRMListingPreset,
) {
  const locale = useSiteLocale()
  const [cities, setCities] = useState<CRMCityOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locationGroupKeys = useMemo(
    () => resolveLocationGroupKeys(coast, coasts),
    [coast, coasts],
  )

  const locationGroupKeysKey = locationGroupKeys.join(',')

  useEffect(() => {
    if (!locationGroupKeys.length) {
      setCities([])
      setLoading(false)
      return
    }

    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const nextCities = await fetchCRMCities(locationGroupKeys, locale, listingPreset, {
          signal: controller.signal,
        })
        setCities(nextCities)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Failed to load CRM cities', err)
        setCities([])
        setError('Unable to load cities')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [locationGroupKeysKey, locale, listingPreset, locationGroupKeys])

  return { cities, loading, error }
}
