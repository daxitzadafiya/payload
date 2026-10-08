'use client'

import type { RowLabelProps } from '@payloadcms/ui'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

export const AfterSalesCareRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<{ text?: string }>()
  const label = data?.data?.text?.trim()
  const n = data.rowNumber !== undefined ? data.rowNumber + 1 : ''
  const truncated =
    label && label.length > 56 ? `${label.slice(0, 56).trimEnd()}…` : label
  return <div>{truncated ? `${n}. ${truncated}` : `Service ${n}`}</div>
}
