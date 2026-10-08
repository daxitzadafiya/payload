'use client'

import type { RowLabelProps } from '@payloadcms/ui'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

export const AreaInfoHighlightRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<{ name?: string }>()
  const name = data?.data?.name?.trim()
  const n = data.rowNumber !== undefined ? data.rowNumber + 1 : ''
  return <div>{name ? `${n}. ${name}` : `Area ${n}`}</div>
}

export const AreaInfoCardRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<{ title?: string }>()
  const title = data?.data?.title?.trim()
  const n = data.rowNumber !== undefined ? data.rowNumber + 1 : ''
  return <div>{title ? `${n}. ${title}` : `Card ${n}`}</div>
}
