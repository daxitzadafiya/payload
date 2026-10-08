'use client'

import React, { useEffect } from 'react'
import { MapPin } from 'lucide-react'

import { FilterSelect } from '@/components/FilterSelect'
import { parseCityFilter, parseCoastFilter } from '@/components/PropertyList/filterOptions'
import type { CRMCityOption, CRMCoastOption } from '@/utilities/crmCoasts'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  coast?: string | string[]
  city?: string | string[]
  onCoastChange: (value: string[]) => void
  onCityChange: (value: string[]) => void
  coasts: CRMCoastOption[]
  coastsLoading?: boolean
  cities: CRMCityOption[]
  citiesLoading?: boolean
  coastId?: string
  cityId?: string
  triggerClassName?: string
  iconSize?: number
}

export const CoastCityFilterFields: React.FC<Props> = ({
  coast,
  city,
  onCoastChange,
  onCityChange,
  coasts,
  coastsLoading = false,
  cities,
  citiesLoading = false,
  coastId = 'filter-coast',
  cityId = 'filter-city',
  triggerClassName,
  iconSize = 20,
}) => {
  const coastLabel = useTranslation('propertyList.filters.coasts', 'Coasts')
  const cityLabel = useTranslation('propertyList.filters.city', 'City')
  const allCoastsLabel = useTranslation(
    'propertyList.filters.coasts.emptyLabel',
    'All Coasts',
  )
  const allCitiesLabel = useTranslation('propertyList.filters.city.emptyLabel', 'All City')
  const loadingCoastsLabel = useTranslation('propertyList.filters.loadingCoasts', 'Loading coasts…')
  const loadingCitiesLabel = useTranslation('propertyList.filters.loadingCities', 'Loading cities…')
  const noOptionsFoundLabel = useTranslation(
    'propertyList.filters.noOptionsFound',
    'No options found',
  )

  const selectedCoasts = parseCoastFilter(coast)
  const selectedCities = parseCityFilter(city)

  const coastOptions = React.useMemo(
    () => coasts.map((item) => ({ value: item.value, label: item.label })),
    [coasts],
  )

  const cityOptions = React.useMemo(
    () => cities.map((item) => ({ value: item.value, label: item.label })),
    [cities],
  )

  useEffect(() => {
    const current = parseCoastFilter(coast)
    const validCoasts = current.filter((value) => coasts.some((item) => item.value === value))
    if (validCoasts.length !== current.length) {
      onCoastChange(validCoasts)
    }
  }, [coast, coasts, onCoastChange])

  useEffect(() => {
    const current = parseCityFilter(city)
    const validCities = current.filter((value) => cities.some((item) => item.value === value))
    if (validCities.length !== current.length) {
      onCityChange(validCities)
    }
  }, [city, cities, onCityChange])

  const handleCoastChange = (value: string[]) => {
    onCoastChange(value)
    onCityChange([])
  }

  const icon = <MapPin size={iconSize} strokeWidth={1.75} />

  return (
    <>
      <FilterSelect
        mode="multi"
        label={coastLabel}
        id={coastId}
        icon={icon}
        options={coastOptions}
        value={selectedCoasts}
        onChange={handleCoastChange}
        emptyLabel={coastsLoading ? loadingCoastsLabel : allCoastsLabel}
        loading={coastsLoading}
        noOptionsLabel={noOptionsFoundLabel}
        triggerClassName={triggerClassName}
      />

      <FilterSelect
        mode="multi"
        label={cityLabel}
        id={cityId}
        icon={icon}
        options={cityOptions}
        value={selectedCities}
        onChange={onCityChange}
        emptyLabel={citiesLoading ? loadingCitiesLabel : allCitiesLabel}
        loading={citiesLoading}
        noOptionsLabel={noOptionsFoundLabel}
        disabled={coastsLoading || !coasts.length}
        triggerClassName={triggerClassName}
      />
    </>
  )
}
