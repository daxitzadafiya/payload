'use client'

import { Footer } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const CertificationRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Footer['certifications']>[number]>()

  const labelText =
    data?.data?.label?.trim() ||
    (typeof data?.data?.image === 'object' && data.data.image?.filename
      ? data.data.image.filename
      : null)

  const label = labelText
    ? `Certification ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${labelText}`
    : `Certification ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}`.trim() || 'Row'

  return <div>{label}</div>
}
