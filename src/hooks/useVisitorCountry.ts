'use client'

import { useEffect, useState } from 'react'

import {
  readCachedVisitorCountry,
  VISITOR_COUNTRY_TTL_MS,
  writeCachedVisitorCountry,
} from '@/utilities/visitorCountry/cache'
import { fetchCountryFromIpApi } from '@/utilities/visitorCountry/ipApi'

let inflightLookup: Promise<string | null> | null = null

async function resolveVisitorCountry(options?: { bypassCache?: boolean }): Promise<string | null> {
  if (!options?.bypassCache) {
    const cached = readCachedVisitorCountry()
    if (cached) return cached
  }

  if (inflightLookup) return inflightLookup

  inflightLookup = fetchCountryFromIpApi()
    .then((countryCode) => {
      if (countryCode) writeCachedVisitorCountry(countryCode)
      return countryCode
    })
    .catch(() => null)
    .finally(() => {
      inflightLookup = null
    })

  return inflightLookup
}

/**
 * Returns a cached ISO country code for the current visitor (e.g. "us", "in").
 * Uses ipapi.co (same as virtual-chatbot) and refreshes the localStorage cache every 15 minutes.
 *
 * Starts as null during SSR and the first client render to avoid hydration mismatches;
 * geo/cached country is applied in useEffect after mount.
 */
export function useVisitorCountry(): string | null {
  const [countryCode, setCountryCode] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const applyCountry = (resolved: string | null) => {
      if (!cancelled && resolved) setCountryCode(resolved)
    }

    const cached = readCachedVisitorCountry()
    if (cached) applyCountry(cached)
    else void resolveVisitorCountry().then(applyCountry)

    const intervalId = window.setInterval(() => {
      void resolveVisitorCountry({ bypassCache: true }).then(applyCountry)
    }, VISITOR_COUNTRY_TTL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  return countryCode
}
