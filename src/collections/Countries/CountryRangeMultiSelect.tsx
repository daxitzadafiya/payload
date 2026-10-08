'use client'

import type { JSONFieldClientComponent } from 'payload'
import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

type RangeOption = {
  value: string
  label: string
}

type PropertyFiltersGlobal = {
  priceRanges?: Array<{ value?: string | null; label?: string | null } | null> | null
  holidayBudgetRanges?: Array<{ value?: string | null; label?: string | null } | null> | null
}

function normalizeSelected(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

/**
 * Multi-select of Property Filters range values stored as a JSON string[].
 * `admin.custom.source` is `priceRanges` or `holidayBudgetRanges`.
 */
export const CountryRangeMultiSelect: JSONFieldClientComponent = (props) => {
  const {
    field: { admin: { className, description, style, custom } = {}, label, required } = {},
    path: pathFromProps,
    readOnly,
  } = props

  const source =
    custom && typeof custom === 'object' && 'source' in custom
      ? String((custom as { source?: string }).source)
      : 'priceRanges'

  const { disabled, path, setValue, showError, value } = useField<unknown>({
    potentiallyStalePath: pathFromProps,
  })

  const selected = useMemo(() => normalizeSelected(value), [value])
  const [options, setOptions] = useState<RangeOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/globals/propertyFilters?depth=0', {
          credentials: 'include',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Failed to load ranges (${response.status})`)

        const data = (await response.json()) as PropertyFiltersGlobal
        const rows = source === 'holidayBudgetRanges' ? data.holidayBudgetRanges : data.priceRanges

        const nextOptions = (rows ?? [])
          .map((row) => {
            const optionValue = row?.value?.trim() ?? ''
            const optionLabel = row?.label?.trim() ?? optionValue
            if (!optionValue) return null
            return { value: optionValue, label: optionLabel || optionValue }
          })
          .filter((row): row is RangeOption => row !== null)

        setOptions(nextOptions)
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error(error)
        setOptions([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [source])

  const toggle = useCallback(
    (optionValue: string) => {
      if (readOnly || disabled) return
      const next = selected.includes(optionValue)
        ? selected.filter((item) => item !== optionValue)
        : [...selected, optionValue]
      setValue(next)
    },
    [disabled, readOnly, selected, setValue],
  )

  return (
    <div className={['field-type', 'json', className].filter(Boolean).join(' ')} style={style}>
      <FieldLabel label={label} path={path} required={required} />
      <FieldError path={path} showError={showError} />

      {loading ? (
        <p style={{ fontSize: 13, opacity: 0.7, margin: '8px 0' }}>Loading options…</p>
      ) : options.length === 0 ? (
        <p style={{ fontSize: 13, opacity: 0.7, margin: '8px 0' }}>
          No ranges found in Property Filters. Add ranges there first.
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 8,
            padding: 12,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 4,
            background: 'var(--theme-elevation-50)',
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {options.map((option) => {
            const checked = selected.includes(option.value)
            const id = `${path}__${option.value}`.replace(/[^a-zA-Z0-9_-]/g, '_')
            return (
              <label
                key={option.value}
                htmlFor={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: readOnly || disabled ? 'default' : 'pointer',
                  fontSize: 13,
                }}
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  disabled={readOnly || disabled}
                  onChange={() => toggle(option.value)}
                />
                <span>
                  {option.label}
                  <span style={{ opacity: 0.55, marginLeft: 6 }}>({option.value})</span>
                </span>
              </label>
            )
          })}
        </div>
      )}

      <FieldDescription description={description} path={path} />
    </div>
  )
}
