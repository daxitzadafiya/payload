'use client'

import { useEffect, useMemo, useState } from 'react'

import { fetchCRMCoasts, type CRMCoastOption } from '@/utilities/crmCoasts'

export function useCRMCoasts(country?: string[]) {
  const [coasts, setCoasts] = useState<CRMCoastOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const countryKeys = useMemo(() => {
    const keys = (country ?? [])
      .map((key) => key.trim())
      .filter((key) => key && key !== 'all' && key !== 'any')
    // CRM only accepts a single country key.
    return keys.slice(0, 1)
  }, [country])
  const countryKey = countryKeys[0] ?? ''

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const nextCoasts = await fetchCRMCoasts(countryKeys, { signal: controller.signal })
        setCoasts(nextCoasts)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Failed to load CRM coasts', err)
        setCoasts([])
        setError('Unable to load coasts')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [countryKey, countryKeys])

  return { coasts, loading, error }
}
