'use client'

import { useEffect, useState } from 'react'

import type { FilterSelectOption } from '@/components/FilterSelect'
import {
  fetchCRMCommercialTypes,
  toPropertyTypeFilterOptions,
} from '@/utilities/crmCommercialTypes'
import type { CRMListingPreset } from '@/utilities/crmProperties'
import { useSiteLocale } from '@/utilities/useSiteLocale'

export function useCRMPropertyTypeOptions(listingPreset: CRMListingPreset) {
  const locale = useSiteLocale()
  const [options, setOptions] = useState<FilterSelectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const types = await fetchCRMCommercialTypes(locale, listingPreset, {
          signal: controller.signal,
        })
        setOptions(toPropertyTypeFilterOptions(types))
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Failed to load CRM property types', err)
        setOptions([])
        setError('Unable to load property types')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [locale, listingPreset])

  return { options, loading, error }
}
