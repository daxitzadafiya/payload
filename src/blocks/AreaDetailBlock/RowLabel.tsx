'use client'

import type { RowLabelProps } from '@payloadcms/ui'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

export const AreaDetailStatRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<{ label?: string; value?: string }>()
  const label = data?.data?.label?.trim()
  const value = data?.data?.value?.trim()
  const n = data.rowNumber !== undefined ? data.rowNumber + 1 : ''
  if (label && value) return <div>{`${n}. ${label}: ${value}`}</div>
  return <div>{label ? `${n}. ${label}` : `Stat ${n}`}</div>
}

export const AreaDetailDistanceRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<{ label?: string; value?: string }>()
  const label = data?.data?.label?.trim()
  const value = data?.data?.value?.trim()
  const n = data.rowNumber !== undefined ? data.rowNumber + 1 : ''
  if (label && value) return <div>{`${n}. ${label}: ${value}`}</div>
  return <div>{label ? `${n}. ${label}` : `Distance ${n}`}</div>
}
