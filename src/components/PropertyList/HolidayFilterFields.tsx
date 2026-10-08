'use client'

import React from 'react'
import { Banknote, Users } from 'lucide-react'

import { FilterSelect } from '@/components/FilterSelect'
import { CountFilterField } from '@/components/PropertyList/CountFilterField'
import { CoastCityFilterFields } from '@/components/CoastCityFilterFields'
import type { CRMCityOption, CRMCoastOption } from '@/utilities/crmCoasts'
import { DEFAULT_MAX_HOLIDAY_GUESTS, MIN_HOLIDAY_GUESTS } from '@/utilities/crmHoliday'
import type { PropertyListFilters } from '@/utilities/crmProperties'
import { PeriodFilterFields } from './PeriodFilterFields'
import { COUNT_FILTER_OTHER_VALUE } from './filterOptions'
import { useGuestOptions, useHolidayBudgetOptions } from './useFilterOptionLabels'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  filters: Pick<
    PropertyListFilters,
    'coast' | 'city' | 'periodFrom' | 'periodTo' | 'guests' | 'guestsCustom' | 'totalBudget'
  >
  onChange: <K extends keyof PropertyListFilters>(key: K, value: PropertyListFilters[K]) => void
  coasts: CRMCoastOption[]
  coastsLoading?: boolean
  cities: CRMCityOption[]
  citiesLoading?: boolean
  idPrefix?: string
  dateInputClassName?: string
  /** Country-selected holiday budget values; empty/undefined = all. */
  holidayBudgetValues?: readonly string[] | null
}

export const HolidayFilterFields: React.FC<Props> = ({
  filters,
  onChange,
  coasts,
  coastsLoading = false,
  cities,
  citiesLoading = false,
  idPrefix = 'holiday-filter',
  dateInputClassName,
  holidayBudgetValues,
}) => {
  const guestOptions = useGuestOptions()
  const holidayBudgetOptions = useHolidayBudgetOptions(holidayBudgetValues)

  const guestsLabel = useTranslation('propertyList.filters.guests', 'Guests')
  const totalBudgetLabel = useTranslation('propertyList.filters.totalBudget', 'Total Budget')
  const needMoreLabel = useTranslation('propertyList.filters.needMore', 'More Guests')
  const guestsCustomPlaceholder = useTranslation(
    'propertyList.filters.guestsCustomPlaceholder',
    `1–${DEFAULT_MAX_HOLIDAY_GUESTS} Guest`,
  )

  const guestsWithOther = React.useMemo(() => {
    const hasOther = guestOptions.some((option) => option.value === COUNT_FILTER_OTHER_VALUE)
    if (hasOther) return guestOptions
    return [...guestOptions, { value: COUNT_FILTER_OTHER_VALUE, label: needMoreLabel }]
  }, [guestOptions, needMoreLabel])

  const handleGuestsCustomChange = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) {
      onChange('guestsCustom', '')
      return
    }
    const parsed = Number(digits)
    if (!Number.isFinite(parsed)) {
      onChange('guestsCustom', '')
      return
    }
    const clamped = Math.min(Math.max(parsed, MIN_HOLIDAY_GUESTS), DEFAULT_MAX_HOLIDAY_GUESTS)
    onChange('guestsCustom', String(clamped))
  }

  return (
    <>
      <CoastCityFilterFields
        coast={filters.coast}
        city={filters.city}
        onCoastChange={(value) => onChange('coast', value)}
        onCityChange={(value) => onChange('city', value)}
        coasts={coasts}
        coastsLoading={coastsLoading}
        cities={cities}
        citiesLoading={citiesLoading}
        coastId={`${idPrefix}-coast`}
        cityId={`${idPrefix}-city`}
      />

      <PeriodFilterFields
        periodFrom={filters.periodFrom ?? ''}
        periodTo={filters.periodTo ?? ''}
        onPeriodFromChange={(value) => onChange('periodFrom', value)}
        onPeriodToChange={(value) => onChange('periodTo', value)}
        idPrefix={idPrefix}
        dateInputClassName={dateInputClassName}
      />

      <CountFilterField
        label={guestsLabel}
        id={`${idPrefix}-guests`}
        icon={<Users size={20} strokeWidth={1.75} />}
        options={guestsWithOther}
        value={filters.guests ?? 'any'}
        customValue={filters.guestsCustom ?? ''}
        onChange={(value) => onChange('guests', value)}
        onCustomChange={handleGuestsCustomChange}
        customPlaceholder={guestsCustomPlaceholder}
      />

      <FilterSelect
        label={totalBudgetLabel}
        id={`${idPrefix}-budget`}
        icon={<Banknote size={20} strokeWidth={1.75} />}
        options={holidayBudgetOptions}
        value={filters.totalBudget ?? 'any'}
        onChange={(value) => onChange('totalBudget', value)}
      />
    </>
  )
}
