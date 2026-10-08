'use client'

import type { RowLabelProps } from '@payloadcms/ui'
import { useRowLabel } from '@payloadcms/ui'

export const FrequentQuestionsRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<{ question?: string }>()
  const label = data?.data?.question?.trim()
  const n = data.rowNumber !== undefined ? data.rowNumber + 1 : ''
  return <div>{label ? `${n}. ${label}` : `Question ${n}`}</div>
}
