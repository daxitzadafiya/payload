'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@payloadcms/ui'

type CountryOption = {
  id: number
  adminLabel: string
  isoCode?: string | null
  offerSale?: boolean | null
  isDefault?: boolean | null
}

type CountriesResponse = {
  docs?: CountryOption[]
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const data = (await response.json().catch(() => ({}))) as T & { error?: string }

  if (!response.ok) {
    const message =
      (typeof data.error === 'string' && data.error) ||
      `Request failed (${response.status})`
    throw new Error(message)
  }

  return data
}

export function DefaultCountrySelect() {
  const [options, setOptions] = useState<CountryOption[]>([])
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        depth: '0',
        limit: '200',
        sort: 'adminLabel',
        'where[or][0][offerSale][equals]': 'true',
        'where[or][1][isDefault][equals]': 'true',
      })

      const data = await fetchJson<CountriesResponse>(`/api/countries?${params.toString()}`)
      const docs = Array.isArray(data.docs) ? data.docs : []
      const saleCountries = docs.filter((doc) => doc.offerSale === true)
      const currentDefault = docs.find((doc) => doc.isDefault === true)

      setOptions(saleCountries)

      // Drop a stale default that is no longer enabled for Sale.
      if (currentDefault && currentDefault.offerSale !== true) {
        setValue('')
        await fetch('/api/settings/countries/default', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ countryId: null }),
        }).catch(() => undefined)
        return
      }

      setValue(currentDefault ? String(currentDefault.id) : '')
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to load countries')
      setOptions([])
      setValue('')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selectOptions = useMemo(
    () =>
      options.map((country) => ({
        value: String(country.id),
        label: country.isoCode
          ? `${country.adminLabel} (${country.isoCode})`
          : country.adminLabel,
      })),
    [options],
  )

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.target.value
      const previous = value
      setValue(nextValue)
      setSaving(true)

      try {
        await toast.promise(
          (async () => {
            const response = await fetch('/api/settings/countries/default', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                countryId: nextValue ? Number(nextValue) : null,
              }),
            })

            const data = (await response.json().catch(() => ({}))) as {
              error?: string
            }

            if (!response.ok) {
              throw new Error(data.error || 'Failed to update default country')
            }

            await load()
          })(),
          {
            loading: 'Updating default country…',
            success: nextValue ? 'Default country updated' : 'Default country cleared',
            error: (err) => (err instanceof Error ? err.message : 'Update failed'),
          },
        )
      } catch {
        setValue(previous)
      } finally {
        setSaving(false)
      }
    },
    [load, value],
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <label
        htmlFor="countries-default-select"
        style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}
      >
        Default country
      </label>
      <select
        id="countries-default-select"
        value={value}
        onChange={handleChange}
        disabled={loading || saving || selectOptions.length === 0}
        style={{
          minWidth: 220,
          height: 32,
          padding: '0 10px',
          borderRadius: 4,
          border: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-input-bg)',
          color: 'var(--theme-text)',
        }}
      >
        <option value="">
          {loading
            ? 'Loading…'
            : selectOptions.length === 0
              ? 'Enable Sale for a country first'
              : 'None'}
        </option>
        {selectOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {!loading && selectOptions.length === 0 ? (
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          Enable Sale for countries that may be selected as the default.
        </span>
      ) : null}
    </div>
  )
}
