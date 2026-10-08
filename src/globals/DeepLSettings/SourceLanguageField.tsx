'use client'

import { SelectField } from '@payloadcms/ui'
import type { Option, SelectFieldClientProps } from 'payload'
import { useMemo } from 'react'

import { useConfiguredLocales } from '@/collections/Translations/useConfiguredLocales'

function optionValue(option: Option): string {
  if (typeof option === 'string') return option
  if ('value' in option && option.value != null) return String(option.value)
  return ''
}

/**
 * Source language options are limited to languages enabled in
 * Globals → Localization (same set as the admin Locale menu).
 */
export function DeepLSourceLanguageField(props: SelectFieldClientProps) {
  const configured = useConfiguredLocales()
  const allowed = useMemo(() => new Set(configured.map((locale) => locale.code)), [configured])

  const options = useMemo(() => {
    const source = props.field.options ?? []
    const filtered = source.filter((option) => allowed.has(optionValue(option)))
    return filtered.length > 0 ? filtered : source
  }, [allowed, props.field.options])

  return (
    <SelectField
      {...props}
      field={{
        ...props.field,
        options,
      }}
    />
  )
}
