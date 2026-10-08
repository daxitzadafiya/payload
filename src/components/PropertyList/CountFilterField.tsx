'use client'

import React from 'react'

import { FilterSelect } from '@/components/FilterSelect'
import { COUNT_FILTER_OTHER_VALUE } from './filterOptions'

type Props = {
  label: string
  value: string
  customValue: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
  onCustomChange: (value: string) => void
  icon?: React.ReactNode
  customPlaceholder?: string
  id?: string
  triggerClassName?: string
  customInputClassName?: string
}

export const CountFilterField: React.FC<Props> = ({
  label,
  value,
  customValue,
  options,
  onChange,
  onCustomChange,
  icon,
  customPlaceholder = 'Enter number',
  id,
  triggerClassName,
  customInputClassName,
}) => {
  const handleChange = (next: string) => {
    onChange(next)
    if (next !== COUNT_FILTER_OTHER_VALUE) onCustomChange('')
  }

  return (
    <FilterSelect
      label={label}
      id={id}
      options={options}
      value={value}
      onChange={handleChange}
      icon={icon}
      customOptionValue={COUNT_FILTER_OTHER_VALUE}
      customValue={customValue}
      onCustomValueChange={onCustomChange}
      customPlaceholder={customPlaceholder}
      triggerClassName={triggerClassName}
      customInputClassName={customInputClassName}
    />
  )
}
