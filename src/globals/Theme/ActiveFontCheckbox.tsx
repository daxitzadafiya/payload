'use client'

import type { CheckboxFieldClientComponent } from 'payload'
import {
  CheckboxInput,
  FieldDescription,
  FieldError,
  useField,
  useForm,
} from '@payloadcms/ui'
import React, { useCallback } from 'react'

/**
 * Active checkbox that behaves like a radio within the Google Fonts array:
 * checking one row clears `active` on every other row.
 * Unchecking the current active font is blocked so exactly one stays selected.
 */
export const ActiveFontCheckbox: CheckboxFieldClientComponent = (props) => {
  const {
    field: { admin: { className, description, style } = {}, label, required } = {},
    path: pathFromProps,
    readOnly,
  } = props

  const { disabled, path, setValue, showError, value } = useField<boolean>({
    potentiallyStalePath: pathFromProps,
  })
  const { dispatchFields, getDataByPath, uuid } = useForm()

  const clearSiblingActives = useCallback(
    (activePath: string) => {
      const match = /^(googleFonts)\.(\d+)\.active$/.exec(activePath)
      if (!match) return

      const arrayPath = match[1]
      const rowIndex = Number(match[2])
      const rows = getDataByPath(arrayPath) as unknown[] | undefined
      const length = Array.isArray(rows) ? rows.length : 0

      for (let i = 0; i < length; i++) {
        if (i === rowIndex) continue
        dispatchFields({
          type: 'UPDATE',
          path: `${arrayPath}.${i}.active`,
          value: false,
        })
      }
    },
    [dispatchFields, getDataByPath],
  )

  const onToggle = useCallback(() => {
    if (readOnly || disabled) return

    // Already active — keep it (radio behavior).
    if (value) return

    setValue(true)
    clearSiblingActives(path)
  }, [clearSiblingActives, disabled, path, readOnly, setValue, value])

  const checked = Boolean(value)
  const fieldID = `field-${path.replace(/\./g, '__')}-${uuid}`

  return (
    <div
      className={['field-type', 'checkbox', className, checked ? 'checkbox--checked' : '']
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <FieldError path={path} showError={showError} />
      <CheckboxInput
        checked={checked}
        id={fieldID}
        label={typeof label === 'string' ? label : 'Active'}
        name={path}
        onToggle={onToggle}
        readOnly={readOnly || disabled}
        required={required}
      />
      <FieldDescription description={description} path={path} />
    </div>
  )
}
