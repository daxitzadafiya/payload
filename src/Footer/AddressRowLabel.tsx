'use client'

import { Footer } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const AddressRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<NonNullable<Footer['contact']>['addresses']>[number]>()

  const labelText = data?.data?.address?.trim()
  const label = labelText
    ? `Address ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${labelText}`
    : `Address ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}`.trim() || 'Row'

  return <div>{label}</div>
}
