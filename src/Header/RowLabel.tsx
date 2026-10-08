'use client'
import { Header } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const RowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Header['navItems']>[number]>()

  const subCount = data?.data?.subLinks?.length ?? 0
  const baseLabel = data?.data?.link?.label
  const label = baseLabel
    ? `Nav item ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${baseLabel}${subCount > 0 ? ` (${subCount} sub-links)` : ''}`
    : 'Row'

  return <div>{label}</div>
}
