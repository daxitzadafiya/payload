'use client'

import type { RowLabelProps } from '@payloadcms/ui'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

export const OurTestimonialsRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<{ attribution?: string; quote?: string }>()
  const attribution = data?.data?.attribution?.trim()
  const quote = data?.data?.quote?.trim()
  const n = data.rowNumber !== undefined ? data.rowNumber + 1 : ''
  const label = attribution || quote
  const truncated =
    label && label.length > 56 ? `${label.slice(0, 56).trimEnd()}…` : label
  return <div>{truncated ? `${n}. ${truncated}` : `Testimonial ${n}`}</div>
}
