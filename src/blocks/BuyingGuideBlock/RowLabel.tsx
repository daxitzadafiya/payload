'use client'

import type { RowLabelProps } from '@payloadcms/ui'
import { useRowLabel } from '@payloadcms/ui'

export const BuyingGuideRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<{ title?: string }>()
  const label = data?.data?.title?.trim()
  const n = data.rowNumber !== undefined ? data.rowNumber + 1 : ''
  return <div>{label ? `${n}. ${label}` : `Step ${n}`}</div>
}
