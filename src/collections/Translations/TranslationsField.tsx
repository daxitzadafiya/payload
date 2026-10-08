'use client'

import { FieldDescription, FieldError, FieldLabel, TextInput, useField } from '@payloadcms/ui'
import { useCallback, useMemo } from 'react'
import type { JSONFieldClientProps } from 'payload'

import { parseTranslationMap, type TranslationMap } from './parseTranslationMap'
import { useConfiguredLocales } from './useConfiguredLocales'

export const TranslationsField: React.FC<JSONFieldClientProps> = ({
  field,
  path,
  readOnly,
}) => {
  const configuredLocales = useConfiguredLocales()
  const { value, setValue, showError } = useField<TranslationMap | null>({ path })
  const map = useMemo(() => parseTranslationMap(value), [value])

  const updateLocale = useCallback(
    (locale: string, text: string) => {
      const next = { ...map }
      if (text.trim()) {
        next[locale] = text
      } else {
        delete next[locale]
      }
      setValue(next)
    },
    [map, setValue],
  )

  return (
    <div className="field-type json">
      <FieldLabel label={field.label} path={path} required={field.required} />
      <FieldDescription description={field.admin?.description} path={path} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        {configuredLocales.map(({ code, label }) => (
          <div key={code}>
            <label
              htmlFor={`field-${path}-${code}`}
              style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}
            >
              {label} ({code})
            </label>
            <TextInput
              path={`${path}-${code}`}
              value={map[code] ?? ''}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                updateLocale(code, event.target.value)
              }
              readOnly={readOnly}
            />
          </div>
        ))}
      </div>
      <FieldError path={path} showError={showError} />
    </div>
  )
}
