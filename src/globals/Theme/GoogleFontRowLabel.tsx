'use client'

import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

type GoogleFontRow = {
  family?: string | null
  active?: boolean | null
}

export const GoogleFontRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<GoogleFontRow>()
  const family = data?.data?.family?.trim()
  const active = Boolean(data?.data?.active)
  const n = data.rowNumber !== undefined ? data.rowNumber + 1 : ''

  if (family) {
    return (
      <div>
        {family}
        {active ? ' · Active' : ''}
      </div>
    )
  }

  return <div>{`Font ${n}`.trim() || 'Font'}</div>
}
