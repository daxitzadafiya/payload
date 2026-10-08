'use client'

import type { RowLabelProps } from '@payloadcms/ui'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

export const HeroButtonRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<{ label?: string }>()
  const label = data?.data?.label?.trim()
  const isPrimary = data.rowNumber === 0
  const n = data.rowNumber !== undefined ? data.rowNumber + 1 : ''

  if (isPrimary) {
    return <div>{label ? `Primary — ${label}` : 'Primary button'}</div>
  }

  return <div>{label ? `${n}. ${label}` : `Button ${n}`}</div>
}
