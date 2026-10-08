'use client'

import type { DefaultCellComponentProps } from 'payload'

import { parseTranslationMap } from './parseTranslationMap'
import { useConfiguredLocales } from './useConfiguredLocales'

const MAX_TEXT_LENGTH = 80

function truncate(text: string, max = MAX_TEXT_LENGTH): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export const TranslationsCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const configuredLocales = useConfiguredLocales()
  const map = parseTranslationMap(cellData)
  const locales = configuredLocales.map((locale) => locale.code).filter((code) => map[code])

  if (locales.length === 0) {
    return <span style={{ opacity: 0.5 }}>—</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
      {locales.map((code) => (
        <div
          key={code}
          style={{ display: 'flex', gap: '6px', alignItems: 'baseline', minWidth: 0 }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--theme-elevation-500)',
              flexShrink: 0,
            }}
          >
            {code}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {truncate(map[code])}
          </span>
        </div>
      ))}
    </div>
  )
}
