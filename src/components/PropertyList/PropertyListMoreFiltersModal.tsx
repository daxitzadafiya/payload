'use client'

import React, { useEffect } from 'react'
import {
  Banknote,
  Bath,
  Bed,
  Globe,
  Home,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Tag,
  X,
} from 'lucide-react'

import { FilterSelect } from '@/components/FilterSelect'
import type { FilterSelectOption } from '@/components/FilterSelect'
import { CoastCityFilterFields } from '@/components/CoastCityFilterFields'
import type { CRMCityOption, CRMCoastOption } from '@/utilities/crmCoasts'
import type { CRMCountryOption } from '@/utilities/crmCountries'
import type { PropertyListFilters as Filters } from '@/utilities/crmProperties'
import type { FloatingMenuPlacement } from '@/utilities/floatingMenuPosition'
import { CountFilterField } from './CountFilterField'
import { parseCountryFilter, parseFeaturesFilter, parsePropertyTypeFilter } from './filterOptions'
import {
  useBathroomOptions,
  useBedroomOptions,
  useDeliveryDateOptions,
  useDistanceToSeaOptions,
  useFeatureFilterOptions,
  useMaxPriceOptions,
  useMinPriceOptions,
} from './useFilterOptionLabels'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  open: boolean
  filters: Filters
  onChange: (key: keyof Filters, value: Filters[keyof Filters]) => void
  onClose: () => void
  onClear: () => void
  onSearch: () => void
  onSaveSearch?: () => void
  propertyTypeOptions: FilterSelectOption[]
  propertyTypeLoading?: boolean
  countries: CRMCountryOption[]
  countriesLoading?: boolean
  showCountryFilter?: boolean
  /** Country-selected price range values; empty/undefined = all (derives Min/Max). */
  priceRangeValues?: readonly string[] | null
  coasts: CRMCoastOption[]
  coastsLoading?: boolean
  cities: CRMCityOption[]
  citiesLoading?: boolean
  /** Override reference field label (e.g. Reference or project name) */
  referenceLabel?: string
  /** Override reference field placeholder (e.g. projects: Ref or project name) */
  referencePlaceholder?: string
  /** Show delivery + distance-to-sea filters (projects listing). */
  showProjectFilters?: boolean
}

const labelClass = 'font-label-sm text-label-sm uppercase text-on-surface-variant'

const modalInputClass =
  'w-full bg-surface-container-low border-transparent focus:border-tertiary focus:ring-0 rounded-lg py-3 pl-10 pr-4 font-body-md text-body-md text-on-surface'

const filterFieldIcon = { size: 20, strokeWidth: 1.75 } as const

const ModalFieldSelect: React.FC<{
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
  menuPlacement?: FloatingMenuPlacement
  icon?: React.ReactNode
}> = ({ label, value, options, onChange, menuPlacement, icon }) => (
  <FilterSelect
    label={label}
    options={options}
    value={value}
    onChange={onChange}
    menuPlacement={menuPlacement}
    icon={icon}
  />
)

export const PropertyListMoreFiltersModal: React.FC<Props> = ({
  open,
  filters,
  onChange,
  onClose,
  onClear,
  onSearch,
  onSaveSearch,
  propertyTypeOptions,
  propertyTypeLoading = false,
  countries,
  countriesLoading = false,
  showCountryFilter = false,
  priceRangeValues,
  coasts,
  coastsLoading = false,
  cities,
  citiesLoading = false,
  referenceLabel: referenceLabelProp,
  referencePlaceholder: referencePlaceholderProp,
  showProjectFilters = false,
}) => {
  const moreFiltersLabel = useTranslation('propertyList.filters.moreFilters', 'More Filters')
  const referenceLabelDefault = useTranslation('propertyList.filters.reference', 'Reference')
  const referenceLabel = referenceLabelProp || referenceLabelDefault
  const referencePlaceholderDefault = useTranslation(
    'propertyList.filters.reference.placeholder',
    'Reference...',
  )
  const referencePlaceholder = referencePlaceholderProp || referencePlaceholderDefault
  const propertyTypeLabel = useTranslation('propertyList.filters.propertyType', 'Property Type')
  const loadingTypesLabel = useTranslation('propertyList.filters.loadingTypes', 'Loading types…')
  const allPropertiesLabel = useTranslation('propertyList.filters.allProperties', 'All Properties')
  const countryLabel = useTranslation('propertyList.filters.country', 'Country')
  const loadingCountriesLabel = useTranslation('propertyList.filters.loadingCountries', 'Loading countries…')
  const noOptionsFoundLabel = useTranslation(
    'propertyList.filters.noOptionsFound',
    'No options found',
  )
  const bedroomsLabel = useTranslation('propertyList.filters.bedrooms', 'Bedrooms')
  const bathroomsLabel = useTranslation('propertyList.filters.bathrooms', 'Bathrooms')
  const countCustomPlaceholder = useTranslation(
    'propertyList.filters.countCustom.placeholder',
    'Enter number',
  )
  const minPriceLabel = useTranslation('propertyList.filters.minPrice', 'Min Price')
  const maxPriceLabel = useTranslation('propertyList.filters.maxPrice', 'Max Price')
  const featuresLabel = useTranslation('propertyList.filters.features', 'Features')
  const featuresEmptyLabel = useTranslation('propertyList.filters.features.emptyLabel', 'Features')
  const clearFiltersLabel = useTranslation('propertyList.filters.clearFilters', 'Clear Filters')
  const searchLabel = useTranslation('propertyList.filters.search', 'Search')
  const saveFilterLabel = useTranslation('propertyList.filters.saveSearch', 'Save search')
  const closeFiltersAriaLabel = useTranslation(
    'propertyList.filters.closeFiltersAria',
    'Close filters',
  )
  const closeAriaLabel = useTranslation('propertyList.filters.closeAria', 'Close')
  const deliveryDateLabel = useTranslation('propertyList.filters.deliveryDate', 'Delivery date')
  const distanceToSeaLabel = useTranslation(
    'propertyList.filters.distanceToSea',
    'Distance to the sea',
  )
  const bedroomOptions = useBedroomOptions()
  const bathroomOptions = useBathroomOptions()
  const minPriceOptions = useMinPriceOptions(priceRangeValues)
  const maxPriceOptions = useMaxPriceOptions(priceRangeValues)
  const featureFilterOptions = useFeatureFilterOptions()
  const deliveryDateOptions = useDeliveryDateOptions()
  const distanceToSeaOptions = useDistanceToSeaOptions()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Keep Min/Max in sync with country-allowed derived options.
  useEffect(() => {
    if (!open) return
    const min = filters.minPrice ?? 'any'
    const max = filters.maxPrice ?? 'any'
    if (min !== 'any' && !minPriceOptions.some((option) => option.value === min)) {
      onChange('minPrice', 'any')
    }
    if (max !== 'any' && !maxPriceOptions.some((option) => option.value === max)) {
      onChange('maxPrice', 'any')
    }
  }, [filters.maxPrice, filters.minPrice, maxPriceOptions, minPriceOptions, onChange, open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="more-filters-title"
    >
      <button
        type="button"
        aria-label={closeFiltersAriaLabel}
        className="fixed inset-0 bg-black/55"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[min(90vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-outline-variant/30 bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-6 md:px-8 py-5">
          <h2 id="more-filters-title" className="font-headline-sm text-headline-sm text-on-surface">
            {moreFiltersLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            aria-label={closeAriaLabel}
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 md:px-8 py-6 font-body-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex min-w-0 flex-col gap-2">
              <label className={labelClass} htmlFor="filter-reference">
                {referenceLabel}
              </label>
              <div className="relative">
                <Tag
                  {...filterFieldIcon}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
                  aria-hidden
                />
                <input
                  id="filter-reference"
                  type="text"
                  placeholder={referencePlaceholder}
                  value={filters.reference ?? ''}
                  onChange={(e) => onChange('reference', e.target.value)}
                  className={modalInputClass}
                />
              </div>
            </div>

            <div className="min-w-0">
              <FilterSelect
                mode="multi"
                label={propertyTypeLabel}
                options={propertyTypeOptions}
                value={parsePropertyTypeFilter(filters.propertyType)}
                onChange={(value) => onChange('propertyType', value)}
                emptyLabel={propertyTypeLoading ? loadingTypesLabel : allPropertiesLabel}
                loading={propertyTypeLoading}
                noOptionsLabel={noOptionsFoundLabel}
                icon={<Home {...filterFieldIcon} />}
              />
            </div>

            {showCountryFilter && (
              <div className="min-w-0">
                <FilterSelect
                  label={countryLabel}
                  options={countries.map((item) => ({ value: item.value, label: item.label }))}
                  value={parseCountryFilter(filters.country)[0] ?? ''}
                  onChange={(value) => onChange('country', value ? [value] : [])}
                  loading={countriesLoading}
                  placeholder={countriesLoading ? loadingCountriesLabel : countryLabel}
                  noOptionsLabel={noOptionsFoundLabel}
                  icon={<Globe {...filterFieldIcon} />}
                />
              </div>
            )}

            <CoastCityFilterFields
              coast={filters.coast}
              city={filters.city}
              onCoastChange={(value) => onChange('coast', value)}
              onCityChange={(value) => onChange('city', value)}
              coasts={coasts}
              coastsLoading={coastsLoading}
              cities={cities}
              citiesLoading={citiesLoading}
              coastId="filter-modal-coast"
              cityId="filter-modal-city"
            />

            <div className="min-w-0">
              <CountFilterField
                id="filter-bedrooms"
                label={bedroomsLabel}
                value={filters.bedrooms ?? 'any'}
                customValue={filters.bedroomsCustom ?? ''}
                options={bedroomOptions}
                onChange={(value) => onChange('bedrooms', value)}
                onCustomChange={(value) => onChange('bedroomsCustom', value)}
                customPlaceholder={countCustomPlaceholder}
                icon={<Bed {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <CountFilterField
                id="filter-bathrooms"
                label={bathroomsLabel}
                value={filters.bathrooms ?? 'any'}
                customValue={filters.bathroomsCustom ?? ''}
                options={bathroomOptions}
                onChange={(value) => onChange('bathrooms', value)}
                onCustomChange={(value) => onChange('bathroomsCustom', value)}
                customPlaceholder={countCustomPlaceholder}
                icon={<Bath {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label={minPriceLabel}
                value={filters.minPrice ?? 'any'}
                options={minPriceOptions}
                onChange={(v) => onChange('minPrice', v)}
                icon={<Banknote {...filterFieldIcon} />}
              />
            </div>

            <div className="min-w-0">
              <ModalFieldSelect
                label={maxPriceLabel}
                value={filters.maxPrice ?? 'any'}
                options={maxPriceOptions}
                onChange={(v) => onChange('maxPrice', v)}
                icon={<Banknote {...filterFieldIcon} />}
              />
            </div>

            <div className={`min-w-0 ${showCountryFilter ? '' : 'sm:col-span-2'}`}>
              <FilterSelect
                mode="multi"
                label={featuresLabel}
                id="filter-features"
                options={featureFilterOptions}
                value={parseFeaturesFilter(filters.features)}
                onChange={(value) => onChange('features', value)}
                emptyLabel={featuresEmptyLabel}
                icon={<Sparkles {...filterFieldIcon} />}
              />
            </div>

            {showProjectFilters && (
              <>
                <div className="min-w-0">
                  <ModalFieldSelect
                    label={deliveryDateLabel}
                    value={filters.delivery ?? 'any'}
                    options={deliveryDateOptions}
                    onChange={(v) => onChange('delivery', v)}
                    icon={<Tag {...filterFieldIcon} />}
                  />
                </div>
                <div className="min-w-0">
                  <ModalFieldSelect
                    label={distanceToSeaLabel}
                    value={filters.distanceToSea ?? 'any'}
                    options={distanceToSeaOptions}
                    onChange={(v) => onChange('distanceToSea', v)}
                    icon={<Globe {...filterFieldIcon} />}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative z-0 flex shrink-0 flex-col-reverse gap-3 border-t border-outline-variant/30 bg-surface-container-low px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <button
            type="button"
            onClick={() => {
              onClear()
            }}
            className="min-h-11 px-6 py-3 text-on-surface-variant font-label-nav text-label-nav uppercase tracking-widest flex items-center justify-center gap-2 hover:text-primary transition-colors cursor-pointer border border-outline-variant rounded-lg"
          >
            <RotateCcw size={18} aria-hidden />
            {clearFiltersLabel}
          </button>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            {onSaveSearch && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onSaveSearch()
                }}
                className="min-h-11 px-6 py-3 bg-tertiary text-white font-label-nav text-label-nav uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-tertiary-container transition-colors cursor-pointer"
              >
                <Save size={18} strokeWidth={1.75} aria-hidden />
                {saveFilterLabel}
              </button>
            )}
            <button
              type="submit"
              className="min-h-11 px-8 py-3 bg-primary text-on-primary font-label-nav text-label-nav uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-tertiary hover:text-on-tertiary transition-colors cursor-pointer"
            >
              <Search size={18} aria-hidden />
              {searchLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
