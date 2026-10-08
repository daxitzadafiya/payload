'use client'

import type { UIFieldClientComponent } from 'payload'
import { FieldLabel, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import { humanizeFieldPath } from '@/utilities/auditLog/humanizeFieldPath'

type ChangeRow = {
  id?: string | null
  field?: string | null
  oldValue?: string | null
  newValue?: string | null
}

function formatDisplayValue(value: string | null | undefined): string {
  if (value == null || value === '') return '—'
  return value
}

function asChangeRows(raw: unknown): ChangeRow[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (row): row is ChangeRow => Boolean(row) && typeof row === 'object' && Boolean((row as ChangeRow).field),
  )
}

/**
 * Before/after diff for activity log changes, styled close to Payload admin fields.
 * Renders after mount to avoid SSR/client mismatches from form + document hooks.
 */
export const ChangesDiffView: UIFieldClientComponent = ({ field }) => {
  const [mounted, setMounted] = useState(false)
  const { data } = useDocumentInfo()
  const formChanges = useFormFields(([fields]) => fields?.changes?.value)

  useEffect(() => {
    setMounted(true)
  }, [])

  const rows = useMemo(() => {
    const fromDoc = asChangeRows((data as { changes?: unknown } | undefined)?.changes)
    if (fromDoc.length > 0) return fromDoc
    return asChangeRows(formChanges)
  }, [formChanges, data])

  const localeLabel =
    typeof (data as { localeLabel?: unknown } | undefined)?.localeLabel === 'string'
      ? (data as { localeLabel: string }).localeLabel
      : null
  const whereParts = [
    typeof (data as { section?: unknown })?.section === 'string'
      ? (data as { section: string }).section
      : null,
    typeof (data as { documentTitle?: unknown })?.documentTitle === 'string'
      ? (data as { documentTitle: string }).documentTitle
      : null,
  ].filter(Boolean)

  const label =
    typeof field?.label === 'string'
      ? field.label
      : field?.label && typeof field.label === 'object' && 'en' in field.label
        ? String((field.label as { en?: string }).en || 'Changes')
        : 'Changes'

  return (
    <div className="field-type ui al-changes">
      <FieldLabel label={label} />

      {!mounted ? (
        <div className="al-changes__desc">Loading changes…</div>
      ) : rows.length === 0 ? (
        <div className="al-changes__desc">No field changes recorded for this action.</div>
      ) : (
        <>
          <div className="al-changes__desc">
            {rows.length} {rows.length === 1 ? 'field changed' : 'fields changed'}
            {whereParts.length || localeLabel
              ? ` — ${[whereParts.join(' · '), localeLabel ? `Language: ${localeLabel}` : null]
                  .filter(Boolean)
                  .join(' · ')}`
              : ''}
          </div>

          <div className="al-changes__list">
            {rows.map((row, index) => {
              const fieldPath = row.field || `change-${index}`
              return (
                <div key={row.id || `${fieldPath}-${index}`} className="al-changes__item">
                  <div className="al-changes__field-label">{humanizeFieldPath(fieldPath)}</div>
                  <div className="al-changes__field-path">{fieldPath}</div>
                  <div className="al-changes__diff">
                    <div className="al-changes__box al-changes__box--old">
                      <span className="al-changes__box-label">Before</span>
                      <pre>{formatDisplayValue(row.oldValue)}</pre>
                    </div>
                    <div className="al-changes__box al-changes__box--new">
                      <span className="al-changes__box-label">After</span>
                      <pre>{formatDisplayValue(row.newValue)}</pre>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <style>{styles}</style>
    </div>
  )
}

const styles = `
.al-changes {
  width: 100%;
}

.al-changes__desc {
  margin: 0 0 0.75rem;
  font-size: var(--font-size-small, 0.8125rem);
  color: var(--theme-elevation-500);
  line-height: 1.45;
}

.al-changes__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.al-changes__item {
  border: 1px solid var(--theme-elevation-150);
  border-radius: var(--border-radius-s, 3px);
  background: var(--theme-elevation-0);
  padding: 0.75rem;
}

.al-changes__field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--theme-text);
  margin-bottom: 0.15rem;
}

.al-changes__field-path {
  font-size: 0.75rem;
  color: var(--theme-elevation-450, var(--theme-elevation-400));
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
  margin-bottom: 0.65rem;
}

.al-changes__diff {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.al-changes__box {
  min-width: 0;
  border: 1px solid var(--theme-elevation-150);
  border-radius: var(--border-radius-s, 3px);
  padding: 0.5rem 0.6rem;
  background: var(--theme-input-bg, var(--theme-elevation-50));
}

.al-changes__box--old {
  background: color-mix(in srgb, #dc2626 7%, var(--theme-elevation-0, #fff));
  border-color: color-mix(in srgb, #dc2626 22%, var(--theme-elevation-150));
}

.al-changes__box--new {
  background: color-mix(in srgb, #16a34a 7%, var(--theme-elevation-0, #fff));
  border-color: color-mix(in srgb, #16a34a 22%, var(--theme-elevation-150));
}

.al-changes__box-label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--theme-elevation-500);
}

.al-changes__box pre {
  margin: 0;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
  font-size: 0.8125rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--theme-text);
  max-height: 12rem;
  overflow: auto;
}

@media (max-width: 768px) {
  .al-changes__diff {
    grid-template-columns: 1fr;
  }
}
`
