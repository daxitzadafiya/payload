'use client'
import { Footer } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

export const SocialRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Footer['socialLinks']>[number]>()

  const label = data?.data?.icon
    ? `Social ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${data.data.icon}`
    : 'Row'

  return <div>{label}</div>
}
