'use client'

import React from 'react'

import DateRangePickerField from '@/components/PropertyList/DateRangePickerField'
import { useTranslation } from '@/utilities/translateClient'

export const defaultPeriodDateInputClassName =
  'w-full rounded-lg border border-outline-variant/35 bg-surface-cream py-2.5 pl-10 pr-10 text-left font-body-md text-[15px] text-on-surface transition-colors duration-300 focus:border-secondary focus:bg-surface-container-lowest focus:ring-0 md:py-3'

type Props = {
  periodFrom: string
  periodTo: string
  onPeriodFromChange: (value: string) => void
  onPeriodToChange: (value: string) => void
  idPrefix?: string
  dateInputClassName?: string
}

export const PeriodFilterFields: React.FC<Props> = ({
  periodFrom,
  periodTo,
  onPeriodFromChange,
  onPeriodToChange,
  idPrefix = 'period-filter',
  dateInputClassName,
}) => {
  const periodRangeLabel = useTranslation('propertyList.filters.periodRange', 'Stay period')

  return (
    <DateRangePickerField
      id={`${idPrefix}-period-range`}
      label={periodRangeLabel}
      periodFrom={periodFrom}
      periodTo={periodTo}
      onPeriodFromChange={onPeriodFromChange}
      onPeriodToChange={onPeriodToChange}
      triggerClassName={dateInputClassName ?? defaultPeriodDateInputClassName}
    />
  )
}
