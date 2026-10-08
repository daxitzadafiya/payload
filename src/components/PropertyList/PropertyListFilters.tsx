'use client'

import React, { useEffect, useState } from 'react'
import { Banknote, Home, MapPin, RotateCcw, Save, Search, SlidersHorizontal } from 'lucide-react'

import { FilterSelect } from '@/components/FilterSelect'
import type { FilterSelectOption } from '@/components/FilterSelect'
import { CoastCityFilterFields } from '@/components/CoastCityFilterFields'
import type { CRMCityOption, CRMCoastOption } from '@/utilities/crmCoasts'
import type { CRMCountryOption } from '@/utilities/crmCountries'
import type { CRMListingPreset } from '@/utilities/crmProperties'
import type { PropertyListFilters as Filters } from '@/utilities/crmProperties'
import { resolveCountrySelectedRangeValues } from '@/utilities/propertyFilterOptions.shared'
import {
  applyPriceRangeValue,
  EMPTY_PROPERTY_FILTERS,
  hasActivePropertyFilters,
  parseCountryFilter,
  parsePropertyTypeFilter,
  resolvePriceRangeValue,
} from './filterOptions'
import { HolidayFilterFields } from './HolidayFilterFields'
import { usePriceRangeOptions } from './useFilterOptionLabels'
import { PropertyListMoreFiltersModal } from './PropertyListMoreFiltersModal'
import { useTranslation } from '@/utilities/translateClient'
import { cn } from '@/utilities/ui'

type Props = {
  listingPreset: CRMListingPreset
  filters: Filters
  appliedFilters: Filters
  onChange: (key: keyof Filters, value: Filters[keyof Filters]) => void
  onApply: (nextFilters: Filters) => void
  showMap?: boolean | null
  onOpenMap?: () => void
  propertyTypeOptions: FilterSelectOption[]
  propertyTypeLoading?: boolean
  countries: CRMCountryOption[]
  countriesLoading?: boolean
  coasts: CRMCoastOption[]
  coastsLoading?: boolean
  cities: CRMCityOption[]
  citiesLoading?: boolean
  onOpenSaveSearch?: () => void
}

export const PropertyListFilters: React.FC<Props> = ({
  listingPreset,
  filters,
  appliedFilters,
  onChange,
  onApply,
  showMap,
  onOpenMap,
  propertyTypeOptions,
  propertyTypeLoading = false,
  countries,
  countriesLoading = false,
  coasts,
  coastsLoading = false,
  cities,
  citiesLoading = false,
  onOpenSaveSearch,
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const countryPriceRangeValues = resolveCountrySelectedRangeValues(
    countries,
    parseCountryFilter(filters.country),
    'price',
  )
  const countryHolidayBudgetValues = resolveCountrySelectedRangeValues(
    countries,
    parseCountryFilter(filters.country),
    'holiday',
  )
  const priceRangeOptions = usePriceRangeOptions(countryPriceRangeValues)
  const priceRange = resolvePriceRangeValue(filters.minPrice, filters.maxPrice, priceRangeOptions)
  const showClearFilters = hasActivePropertyFilters(appliedFilters)
  const isHolidayList = listingPreset === 'forHoliday'
  const isProjectsList = listingPreset === 'projects'
  // Spain-only site — keep country preselected, hide the selector in more-filters.
  const showCountryFilter = false

  // Clear stale price range / budget when country-allowed options change.
  useEffect(() => {
    if (
      priceRange &&
      priceRange !== 'any' &&
      !priceRangeOptions.some((option) => option.value === priceRange)
    ) {
      onChange('minPrice', 'any')
      onChange('maxPrice', 'any')
    }
  }, [onChange, priceRange, priceRangeOptions])

  useEffect(() => {
    const budget = filters.totalBudget ?? 'any'
    if (budget === 'any') return
    // Holiday budget options are enforced inside HolidayFilterFields via prop;
    // clear here when the selected country no longer allows this budget key.
    const allowed = countryHolidayBudgetValues
    if (allowed?.length && !allowed.includes(budget)) {
      onChange('totalBudget', 'any')
    }
  }, [countryHolidayBudgetValues, filters.totalBudget, onChange])

  const propertyTypeLabel = useTranslation('propertyList.filters.propertyType', 'Property Type')
  const loadingTypesLabel = useTranslation('propertyList.filters.loadingTypes', 'Loading types…')
  const allPropertiesLabel = useTranslation('propertyList.filters.allProperties', 'All Properties')
  const priceRangeLabel = useTranslation('propertyList.filters.priceRange', 'Price Range')
  const noOptionsFoundLabel = useTranslation(
    'propertyList.filters.noOptionsFound',
    'No options found',
  )
  const clearFiltersLabel = useTranslation('propertyList.filters.clearFilters', 'Clear Filters')
  const searchLabel = useTranslation('propertyList.filters.search', 'Search')
  const saveSearchLabel = useTranslation('propertyList.filters.saveSearch', 'Save search')
  const moreFiltersAriaLabel = useTranslation(
    'propertyList.filters.moreFiltersAria',
    'More filters',
  )
  const searchByMapLabel = useTranslation('propertyList.filters.searchByMap', 'Search By Map')
  const projectReferenceLabel = useTranslation(
    'propertyList.filters.reference.projectLabel',
    'Reference or project name',
  )
  const propertyReferenceLabel = useTranslation(
    'propertyList.filters.reference.propertyLabel',
    'Reference or Property name',
  )
  const projectReferencePlaceholder = useTranslation(
    'propertyList.filters.reference.projectPlaceholder',
    'Ref or project name…',
  )
  const propertyReferencePlaceholder = useTranslation(
    'propertyList.filters.reference.propertyPlaceholder',
    'Ref or property name…',
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onApply({ ...filters })
  }

  const handlePriceRangeChange = (range: string) => {
    const { minPrice, maxPrice } = applyPriceRangeValue(range, priceRangeOptions)
    onChange('minPrice', minPrice)
    onChange('maxPrice', maxPrice)
  }

  const handleModalSearch = () => {
    onApply({ ...filters })
    setModalOpen(false)
  }

  const handleClear = () => {
    onApply({ ...EMPTY_PROPERTY_FILTERS })
    setModalOpen(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="relative z-20 mb-10">
        <div className="overflow-hidden rounded-[1.5rem] border border-secondary/30 bg-surface-cream shadow-[0_24px_56px_-32px_rgba(0,0,0,0.22)] md:rounded-[1.75rem]">
          <div className="h-px w-full bg-gradient-to-r from-secondary via-secondary/55 to-transparent" aria-hidden />
          <div className="flex flex-col items-stretch gap-5 p-5 md:flex-row md:items-end md:gap-6 md:p-6 lg:p-7">
          <div
            className={cn(
              'grid w-full flex-1 grid-cols-1 gap-4 md:gap-5',
              isHolidayList ? 'md:grid-cols-5' : 'md:grid-cols-4',
            )}
          >
            {isHolidayList ? (
              <HolidayFilterFields
                filters={filters}
                onChange={onChange}
                coasts={coasts}
                coastsLoading={coastsLoading}
                cities={cities}
                citiesLoading={citiesLoading}
                idPrefix="filter-bar"
                holidayBudgetValues={countryHolidayBudgetValues}
              />
            ) : (
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
                  coastId="filter-bar-coast"
                  cityId="filter-bar-city"
                />

                <FilterSelect
                  mode="multi"
                  label={propertyTypeLabel}
                  id="filter-bar-type"
                  icon={<Home size={20} strokeWidth={1.75} />}
                  options={propertyTypeOptions}
                  value={parsePropertyTypeFilter(filters.propertyType)}
                  onChange={(value) => onChange('propertyType', value)}
                  emptyLabel={propertyTypeLoading ? loadingTypesLabel : allPropertiesLabel}
                  loading={propertyTypeLoading}
                  noOptionsLabel={noOptionsFoundLabel}
                />

                <FilterSelect
                  label={priceRangeLabel}
                  id="filter-bar-price"
                  icon={<Banknote size={20} strokeWidth={1.75} />}
                  options={priceRangeOptions}
                  value={priceRange}
                  onChange={handlePriceRangeChange}
                />
              </>
            )}
          </div>

          <div className="flex w-full shrink-0 gap-2 border-t border-secondary/20 pt-4 md:w-auto md:border-t-0 md:border-l md:border-secondary/25 md:pt-0 md:pl-5">
            {!isHolidayList && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-md border border-secondary/35 bg-surface-sand/60 text-primary transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-on-secondary"
                title={moreFiltersAriaLabel}
                aria-label={moreFiltersAriaLabel}
              >
                <SlidersHorizontal size={17} />
              </button>
            )}
            {showMap && onOpenMap && (
              <button
                type="button"
                onClick={onOpenMap}
                className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-md border border-secondary/35 bg-surface-sand/60 text-primary transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-on-secondary"
                title={searchByMapLabel}
                aria-label={searchByMapLabel}
              >
                <MapPin size={17} />
              </button>
            )}
            {showClearFilters && (
              <button
                type="button"
                onClick={handleClear}
                title={clearFiltersLabel}
                aria-label={clearFiltersLabel}
                className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-md border border-secondary/35 bg-surface-sand/60 text-on-surface-variant transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-on-secondary"
              >
                <RotateCcw size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenSaveSearch?.()}
              title={saveSearchLabel}
              aria-label={saveSearchLabel}
              className="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-md border border-secondary/35 bg-surface-sand/60 text-primary transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-on-secondary"
            >
              <Save size={17} strokeWidth={1.75} />
            </button>
            <button
              type="submit"
              title={searchLabel}
              aria-label={searchLabel}
              className="flex h-[46px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-secondary bg-secondary px-5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_28px_-16px_color-mix(in_srgb,var(--color-secondary)_65%,transparent)] transition-all duration-300 hover:border-primary hover:bg-primary hover:text-on-primary md:min-w-[8.5rem] md:flex-none"
            >
              <Search size={15} />
              <span className="hidden md:inline">{searchLabel}</span>
            </button>
          </div>
          </div>
        </div>
      </form>

      {!isHolidayList && (
        <PropertyListMoreFiltersModal
          open={modalOpen}
          filters={filters}
          onChange={onChange}
          onClose={() => setModalOpen(false)}
          onClear={handleClear}
          onSearch={handleModalSearch}
          onSaveSearch={onOpenSaveSearch}
          propertyTypeOptions={propertyTypeOptions}
          propertyTypeLoading={propertyTypeLoading}
          countries={countries}
          countriesLoading={countriesLoading}
          coasts={coasts}
          coastsLoading={coastsLoading}
          cities={cities}
          citiesLoading={citiesLoading}
          showCountryFilter={showCountryFilter}
          priceRangeValues={countryPriceRangeValues}
          referenceLabel={isProjectsList ? projectReferenceLabel : propertyReferenceLabel}
          referencePlaceholder={
            isProjectsList ? projectReferencePlaceholder : propertyReferencePlaceholder
          }
          showProjectFilters={isProjectsList}
        />
      )}
    </>
  )
}
