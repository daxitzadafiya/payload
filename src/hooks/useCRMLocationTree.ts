'use client'

import { useEffect, useState } from 'react'

import type { CRMLocationCity } from '@/utilities/crmLocations'
import { fetchCRMLocationTree } from '@/utilities/crmLocations'
import type { CRMListingPreset } from '@/utilities/crmProperties'
import { useSiteLocale } from '@/utilities/useSiteLocale'

export function useCRMLocationTree(listingPreset: CRMListingPreset) {
  const locale = useSiteLocale()
  const [tree, setTree] = useState<CRMLocationCity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const nextTree = await fetchCRMLocationTree(locale, listingPreset, {
          signal: controller.signal,
        })
        setTree(nextTree)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Failed to load CRM locations', err)
        setTree([])
        setError('Unable to load locations')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [locale, listingPreset])

  return { tree, loading, error }
}
