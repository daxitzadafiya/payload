'use client'

import type { RowLabelProps } from '@payloadcms/ui'
import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

function TruncatedRowLabel({ emptyPrefix }: { emptyPrefix: string }) {
  const data = useRowLabel<{ text?: string }>()
  const label = data?.data?.text?.trim()
  const n = data.rowNumber !== undefined ? data.rowNumber + 1 : ''
  const truncated =
    label && label.length > 56 ? `${label.slice(0, 56).trimEnd()}…` : label
  return <div>{truncated ? `${n}. ${truncated}` : `${emptyPrefix} ${n}`}</div>
}

export const SellYourPropertyOfferRowLabel: React.FC<RowLabelProps> = () => (
  <TruncatedRowLabel emptyPrefix="Offer" />
)

export const SellYourPropertyQuoteRowLabel: React.FC<RowLabelProps> = () => (
  <TruncatedRowLabel emptyPrefix="Quote" />
)
