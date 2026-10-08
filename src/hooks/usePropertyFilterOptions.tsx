'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import {
  DEFAULT_PROPERTY_FILTER_OPTIONS,
  type PropertyFilterOptions,
} from '@/utilities/propertyFilterOptions.shared'
import { useSiteLocale } from '@/utilities/useSiteLocale'

type PropertyFilterOptionsState = PropertyFilterOptions & {
  loading: boolean
}

const PropertyFilterOptionsContext = createContext<PropertyFilterOptionsState | null>(null)

export function PropertyFilterOptionsProvider({ children }: { children: ReactNode }) {
  const locale = useSiteLocale()
  const [options, setOptions] = useState<PropertyFilterOptions>(DEFAULT_PROPERTY_FILTER_OPTIONS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (locale) params.set('locale', locale)

        const response = await fetch(`/api/settings/property-filters?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error('Failed to load filter options')

        const data = (await response.json()) as PropertyFilterOptions
        setOptions(data)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to load property filter options', error)
          setOptions(DEFAULT_PROPERTY_FILTER_OPTIONS)
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [locale])

  return (
    <PropertyFilterOptionsContext.Provider value={{ ...options, loading }}>
      {children}
    </PropertyFilterOptionsContext.Provider>
  )
}

export function usePropertyFilterOptions(): PropertyFilterOptionsState {
  const context = useContext(PropertyFilterOptionsContext)
  if (context) return context

  return { ...DEFAULT_PROPERTY_FILTER_OPTIONS, loading: false }
}
