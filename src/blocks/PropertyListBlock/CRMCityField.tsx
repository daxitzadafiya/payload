'use client'

import { getTranslation } from '@payloadcms/translations'
import type { NumberFieldClientComponent } from 'payload'
import { useField, useTranslation } from '@payloadcms/ui'
import { SelectInput } from '@payloadcms/ui/fields/Select'
import React, { useEffect, useMemo, useState } from 'react'

import {
  fetchCRMCities,
  fetchCRMCoasts,
  resolveLocationGroupKeys,
  type CRMCityOption,
} from '@/utilities/crmCoasts'

const isLocaleMap = (value: unknown): value is Record<string, string> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const resolveAdminText = (
  value: unknown,
  i18n: Parameters<typeof getTranslation>[1],
  fallback: string,
): string => {
  if (typeof value === 'string' && value.trim()) return getTranslation(value, i18n)
  if (isLocaleMap(value)) return getTranslation(value, i18n)
  return fallback
}

/**
 * City dropdown for city-wise listings — same CRM city API as the home filter.
 * Uses Payload SelectInput so it matches native admin select fields.
 */
export const CRMCityField: NumberFieldClientComponent = (props) => {
  const {
    field: { admin: { className, custom, placeholder, style } = {}, label, required } = {},
    path: pathFromProps,
    readOnly,
  } = props

  const customRecord =
    custom && typeof custom === 'object' ? (custom as Record<string, unknown>) : undefined
  const loadingPlaceholder = customRecord?.loadingPlaceholder
  const fieldLabel = customRecord?.fieldLabel

  const { i18n } = useTranslation()
  const resolvedLabel = resolveAdminText(fieldLabel ?? label, i18n, 'City')

  const { disabled, path, setValue, showError, value } = useField<number | null>({
    potentiallyStalePath: pathFromProps,
  })

  const [cities, setCities] = useState<CRMCityOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      try {
        const coasts = await fetchCRMCoasts(undefined, { signal: controller.signal })
        const locationGroupKeys = resolveLocationGroupKeys([], coasts)
        const nextCities = await fetchCRMCities(locationGroupKeys, 'en', 'forSale', {
          signal: controller.signal,
        })
        setCities(nextCities)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        console.error('Failed to load CRM cities for admin city field', err)
        setCities([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  const options = useMemo(
    () => cities.map((city) => ({ label: city.label, value: String(city.key) })),
    [cities],
  )

  const selected =
    value != null && Number.isFinite(Number(value)) ? String(value) : undefined

  return (
    <SelectInput
      className={className}
      isClearable
      label={resolvedLabel}
      name={path}
      onChange={(option) => {
        if (!option || Array.isArray(option)) {
          setValue(null)
          return
        }
        const next = typeof option.value === 'string' ? option.value.trim() : ''
        if (!next) {
          setValue(null)
          return
        }
        const parsed = Number(next)
        setValue(Number.isFinite(parsed) ? parsed : null)
      }}
      options={options}
      path={path}
      placeholder={resolveAdminText(
        loading ? loadingPlaceholder : placeholder,
        i18n,
        loading ? 'Loading cities…' : 'Select a city…',
      )}
      readOnly={Boolean(readOnly || disabled || loading)}
      required={required}
      showError={showError}
      style={style}
      value={selected}
    />
  )
}
