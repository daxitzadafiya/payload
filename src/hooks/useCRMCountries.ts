'use client'

import { useEffect, useState } from 'react'

import type {
  SiteCountryOption,
  SiteCountryTransaction,
} from '@/utilities/siteCountries.shared'
import { useSiteLocale } from '@/utilities/useSiteLocale'

/** @deprecated Prefer SiteCountryOption — kept for existing call sites. */
export type CRMCountryOption = SiteCountryOption

/**
 * Countries for Sale filters — loaded from CMS Countries collection
 * (CRM is only called when that collection is empty, or via Sync from CRM).
 */
export function useCRMCountries(transaction: SiteCountryTransaction = 'sale') {
  const locale = useSiteLocale()
  const [countries, setCountries] = useState<SiteCountryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)
      // Clear previous transaction's countries so tabs don't briefly show stale options.
      setCountries([])
      try {
        const response = await fetch(
          `/api/settings/countries?locale=${encodeURIComponent(locale)}&transaction=${encodeURIComponent(
            transaction,
          )}`,
          {
            signal: controller.signal,
            cache: 'no-store',
          },
        )

        if (!response.ok) {
          throw new Error(`Countries failed (${response.status})`)
        }

        const nextCountries = (await response.json()) as SiteCountryOption[]
        setCountries(Array.isArray(nextCountries) ? nextCountries : [])
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Failed to load site countries', err)
        setCountries([])
        setError('Unable to load countries')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [locale, transaction])

  return { countries, loading, error }
}
