'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, ChevronDown, Home, Search, Users, X, ArrowRight } from 'lucide-react'
import type { Page } from '@/payload-types'
import { FilterSelect } from '@/components/FilterSelect'
import { CoastCityFilterFields } from '@/components/CoastCityFilterFields'
import DateRangePickerField from '@/components/PropertyList/DateRangePickerField'
import { CountFilterField } from '@/components/PropertyList/CountFilterField'
import { CMSLink, getCMSLinkHref } from '@/components/Link'
import { HeroBackground } from '@/blocks/HeroBlock/HeroBackground'
import { HeroWeather } from '@/blocks/HeroBlock/HeroWeather'
import {
  applyPriceRangeValue,
  COUNT_FILTER_OTHER_VALUE,
  EMPTY_PROPERTY_FILTERS,
  hasAppliedPropertyFilters,
  parseCountryFilter,
  parsePropertyTypeFilter,
  resolvePriceRangeValue,
} from '@/components/PropertyList/filterOptions'
import {
  useGuestOptions,
  useHolidayBudgetOptions,
  usePriceRangeOptions,
} from '@/components/PropertyList/useFilterOptionLabels'
import {
  clearPendingPropertyListFilters,
  normalizePropertyListFilters,
  savePendingPropertyListFilters,
} from '@/components/PropertyList/propertyFilterUrl'
import { useCRMCoasts } from '@/hooks/useCRMCoasts'
import { useCRMCountries } from '@/hooks/useCRMCountries'
import { useCRMCities } from '@/hooks/useCRMCities'
import { useCRMPropertyTypeOptions } from '@/hooks/useCRMPropertyTypeOptions'
import { PropertyFilterOptionsProvider } from '@/hooks/usePropertyFilterOptions'
import type { CRMListingPreset, PropertyListFilters } from '@/utilities/crmProperties'
import { DEFAULT_MAX_HOLIDAY_GUESTS, MIN_HOLIDAY_GUESTS } from '@/utilities/crmHoliday'
import { resolvePreselectedCountryKeys } from '@/utilities/crmCountries'
import { resolveCountrySelectedRangeValues } from '@/utilities/propertyFilterOptions.shared'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'
import { useRegisterHeroOverlay } from '@/providers/HeroOverlay'
import { cn } from '@/utilities/ui'

type Props = Extract<Page['layout'][0], { blockType: 'heroBlock' }>
type HeroPropertyTab = 'sale' | 'rental' | 'holiday'

const ALL_HERO_PROPERTY_TABS: HeroPropertyTab[] = ['sale', 'rental', 'holiday']

const resolveVisibleHeroTabs = (
  propertyTabs?: {
    visibleTabs?: (HeroPropertyTab | null)[] | null
    defaultTab?: HeroPropertyTab | null
  } | null,
): { visibleTabs: HeroPropertyTab[]; defaultTab: HeroPropertyTab } => {
  const visibleFromGroup = (propertyTabs?.visibleTabs ?? []).filter(
    (tab): tab is HeroPropertyTab => tab === 'sale' || tab === 'rental' || tab === 'holiday',
  )
  const visibleTabs = visibleFromGroup.length ? visibleFromGroup : ALL_HERO_PROPERTY_TABS

  const candidate = propertyTabs?.defaultTab ?? visibleTabs[0] ?? 'sale'

  const defaultTab = visibleTabs.includes(candidate) ? candidate : (visibleTabs[0] ?? 'sale')

  return { visibleTabs, defaultTab }
}

const HERO_TAB_PATHS: Record<HeroPropertyTab, string> = {
  sale: '/property-for-sale',
  rental: '/property-for-rent',
  holiday: '/holiday-rentals',
}

const HERO_TAB_PRESETS: Record<HeroPropertyTab, CRMListingPreset> = {
  sale: 'forSale',
  rental: 'forRent',
  holiday: 'forHoliday',
}

const heroCtaPrimaryClassName =
  'inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-secondary bg-secondary px-5 font-label-nav text-[11px] uppercase tracking-[0.14em] text-on-secondary transition-all duration-300 hover:border-primary hover:bg-primary hover:text-on-primary active:scale-[0.98] sm:h-12 sm:w-max sm:px-6 sm:text-[12px]'

const heroCtaSecondaryClassName =
  'inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/75 bg-black/50 px-5 font-label-nav text-[11px] uppercase tracking-[0.14em] text-white shadow-[0_10px_28px_-16px_rgba(0,0,0,0.55)] backdrop-blur-md transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-on-secondary active:scale-[0.98] sm:h-12 sm:w-max sm:px-6 sm:text-[12px]'

const heroEyebrowClassName =
  'm-0 font-label-nav text-[11px] uppercase tracking-[0.2em] text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.45)] sm:text-[12px]'

const heroMainTitleClassName =
  'm-0 w-full max-w-[56rem] text-left font-headline-lg text-[clamp(2rem,4.2vw,3.5rem)] font-light leading-[1.15] tracking-[0.01em] text-white [text-shadow:0_2px_28px_rgba(0,0,0,0.4)]'

const heroSubtitleClassName =
  'm-0 mt-4 w-full max-w-[32rem] text-left font-body-lg text-[clamp(0.95rem,1.4vw,1.15rem)] font-light leading-[1.55] tracking-[0.02em] text-white/85 sm:mt-5'

const heroSearchFormClassName =
  'overflow-hidden rounded-2xl border border-white/20 bg-black/40 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl [&_label]:mb-1.5 [&_label]:ml-0.5 [&_label]:text-[11px] [&_label]:font-normal [&_label]:uppercase [&_label]:tracking-[0.12em] [&_label]:text-white/75 [&_.lucide]:text-secondary [&_button_.lucide]:text-inherit [&_.lucide-chevron-down]:text-white/55'

const heroSearchFieldClassName =
  'w-full rounded-lg border border-white/20 bg-black/25 py-2.5 pl-10 pr-10 text-left font-body-md text-[15px] text-white transition-all duration-300 placeholder:text-white/50 md:py-3 focus:border-secondary/70 focus:bg-black/35 focus:ring-0'

const heroSearchButtonClassName =
  'flex h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary font-label-nav text-[12px] uppercase tracking-[0.14em] text-on-secondary shadow-md transition-all duration-300 hover:bg-primary hover:text-on-primary hover:shadow-lg md:h-[50px] sm:col-span-2 xl:col-span-1 xl:justify-self-end'

const heroMobileOpenButtonClassName =
  'flex h-[52px] w-full cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-lg bg-secondary font-label-nav text-[12px] uppercase tracking-[0.14em] text-on-secondary shadow-xl transition-all duration-300 hover:bg-primary hover:text-on-primary active:scale-[0.98]'

const heroDateFieldClassName =
  'w-full rounded-lg border border-white/20 bg-black/25 py-3 pl-10 pr-3 font-body-md text-[15px] text-white transition-all duration-300 [color-scheme:dark] focus:border-secondary/70 focus:bg-black/35 focus:ring-0'

const heroContainerClassName =
  'w-full max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop'

const heroGridClassName: Record<HeroPropertyTab, string> = {
  // Inline search only renders at xl+; keep a single full row.
  // Country is Spain-only and hidden from the UI (still preselected for coasts).
  sale: 'grid-cols-5',
  rental: 'grid-cols-5',
  holiday: 'grid-cols-6',
}

const heroMobileGridClassName = 'grid-cols-1 sm:grid-cols-2'

const HeroBlockContent: React.FC<Props> = (props) => {
  const {
    title,
    subtitle,
    buttons,
    eyebrowText,
    searchResultsLink,
    showSearch,
    propertyTabs,
    defaultCountry,
  } = props
  const ref = useReveal()
  useRegisterHeroOverlay()
  const router = useRouter()

  const saleTabLabel = useTranslation('hero.searchTabs.sale', 'Sale Properties')
  const rentalTabLabel = useTranslation('hero.searchTabs.rental', 'Rental Properties')
  const holidayTabLabel = useTranslation('hero.searchTabs.holiday', 'Holiday Properties')
  const noOptionsFoundLabel = useTranslation(
    'propertyList.filters.noOptionsFound',
    'No options found',
  )
  const propertyTypeLabel = useTranslation('propertyList.filters.propertyType', 'Property Type')
  const loadingTypesLabel = useTranslation('propertyList.filters.loadingTypes', 'Loading types…')
  const allPropertiesLabel = useTranslation('propertyList.filters.allProperties', 'All Properties')
  const priceRangeLabel = useTranslation('propertyList.filters.priceRange', 'Price Range')
  const periodRangeLabel = useTranslation('propertyList.filters.periodRange', 'Stay period')
  const guestsLabel = useTranslation('propertyList.filters.guests', 'Guests')
  const totalBudgetLabel = useTranslation('propertyList.filters.totalBudget', 'Total Budget')
  const needMoreLabel = useTranslation('propertyList.filters.needMore', 'Need More')
  const guestsCustomPlaceholder = useTranslation(
    'propertyList.filters.guestsCustomPlaceholder',
    `1–${DEFAULT_MAX_HOLIDAY_GUESTS} Guests`,
  )
  const searchLabel = useTranslation('propertyList.filters.search', 'Search')
  const openSearchLabel = useTranslation('hero.searchOpen', 'Search properties')
  const closeSearchLabel = useTranslation('hero.searchClose', 'Close search')
  const searchFiltersTitle = useTranslation('hero.searchFiltersTitle', 'Search filters')
  const scrollLabel = useTranslation('hero.scrollIndicator', 'SCROLL')

  const { visibleTabs, defaultTab } = useMemo(
    () => resolveVisibleHeroTabs(propertyTabs),
    [propertyTabs],
  )

  const [activeTab, setActiveTab] = useState<HeroPropertyTab>(defaultTab)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchFilters, setSearchFilters] = useState<PropertyListFilters>({
    ...EMPTY_PROPERTY_FILTERS,
  })

  const listingPreset = HERO_TAB_PRESETS[activeTab]
  // Keep hero filter option APIs stable; do not re-fetch when switching tabs.
  const filterDataPreset: CRMListingPreset = 'forSale'
  const guestOptions = useGuestOptions()

  const guestsWithOther = useMemo(() => {
    const hasOther = guestOptions.some((option) => option.value === COUNT_FILTER_OTHER_VALUE)
    if (hasOther) return guestOptions
    return [...guestOptions, { value: COUNT_FILTER_OTHER_VALUE, label: needMoreLabel }]
  }, [guestOptions, needMoreLabel])

  const { options: propertyTypeOptions, loading: propertyTypeLoading } =
    useCRMPropertyTypeOptions(filterDataPreset)
  const { countries, loading: countriesLoading } = useCRMCountries(activeTab)

  const selectedCountryKeys = parseCountryFilter(searchFilters.country)
  const countryPriceRangeValues = resolveCountrySelectedRangeValues(
    countries,
    selectedCountryKeys,
    'price',
  )
  const countryHolidayBudgetValues = resolveCountrySelectedRangeValues(
    countries,
    selectedCountryKeys,
    'holiday',
  )
  const priceRangeOptions = usePriceRangeOptions(countryPriceRangeValues)
  const holidayBudgetOptions = useHolidayBudgetOptions(countryHolidayBudgetValues)

  // Per-tab: apply CMS default once when that tab's countries load (if the default
  // country is enabled for this transaction). Reset on tab change.
  const defaultCountryAppliedRef = useRef(false)

  // Prefer selected country; before the default is applied, use CMS default so the
  // first coasts request is already country-scoped (e.g. ?country=1).
  const countryKeysForCoasts = useMemo(() => {
    const selected = parseCountryFilter(searchFilters.country)
    if (selected.length) return selected
    if (!defaultCountryAppliedRef.current && !countriesLoading && countries.length) {
      return resolvePreselectedCountryKeys(countries, defaultCountry)
    }
    return selected
  }, [countries, countriesLoading, defaultCountry, searchFilters.country])

  const { coasts, loading: coastsLoading } = useCRMCoasts(countryKeysForCoasts)
  const { cities, loading: citiesLoading } = useCRMCities(
    searchFilters.coast,
    coasts,
    filterDataPreset,
  )

  const priceRange = resolvePriceRangeValue(
    searchFilters.minPrice,
    searchFilters.maxPrice,
    priceRangeOptions,
  )

  const resetFiltersForTab = useCallback(() => {
    defaultCountryAppliedRef.current = false
    setSearchFilters({ ...EMPTY_PROPERTY_FILTERS })
  }, [])

  // Apply the pre-selected country once when countries load for the active tab: the CMS
  // default when it is enabled for this transaction type, otherwise the first available
  // country. Do not re-apply after the user clears the selection.
  useEffect(() => {
    if (defaultCountryAppliedRef.current || countriesLoading || !countries.length) return
    const defaultKeys = resolvePreselectedCountryKeys(countries, defaultCountry)
    defaultCountryAppliedRef.current = true
    if (!defaultKeys.length) return
    setSearchFilters((prev) => {
      if (prev.country?.length) return prev
      return { ...prev, country: defaultKeys }
    })
  }, [activeTab, countries, countriesLoading, defaultCountry])

  // Drop stale price / budget selections when the country-allowed options change.
  useEffect(() => {
    setSearchFilters((prev) => {
      let next = prev
      const currentRange = resolvePriceRangeValue(prev.minPrice, prev.maxPrice, priceRangeOptions)
      if (
        currentRange &&
        currentRange !== 'any' &&
        !priceRangeOptions.some((o) => o.value === currentRange)
      ) {
        next = { ...next, minPrice: 'any', maxPrice: 'any' }
      }
      const budget = prev.totalBudget ?? 'any'
      if (budget !== 'any' && !holidayBudgetOptions.some((option) => option.value === budget)) {
        next = next === prev ? { ...prev, totalBudget: 'any' } : { ...next, totalBudget: 'any' }
      }
      return next
    })
  }, [holidayBudgetOptions, priceRangeOptions])

  const handleTabChange = (tab: HeroPropertyTab) => {
    setActiveTab(tab)
    resetFiltersForTab()
  }

  const handleSearchFilterChange = (
    key: keyof PropertyListFilters,
    value: PropertyListFilters[keyof PropertyListFilters],
  ) => {
    setSearchFilters((prev) => {
      if (key === 'country') {
        return {
          ...prev,
          country: value as PropertyListFilters['country'],
          coast: [],
          city: [],
          minPrice: 'any',
          maxPrice: 'any',
          totalBudget: 'any',
        }
      }
      return { ...prev, [key]: value }
    })
  }

  const handleGuestsCustomChange = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (!digits) {
      handleSearchFilterChange('guestsCustom', '')
      return
    }
    const parsed = Number(digits)
    if (!Number.isFinite(parsed)) {
      handleSearchFilterChange('guestsCustom', '')
      return
    }
    const clamped = Math.min(Math.max(parsed, MIN_HOLIDAY_GUESTS), DEFAULT_MAX_HOLIDAY_GUESTS)
    handleSearchFilterChange('guestsCustom', String(clamped))
  }

  const handlePriceRangeChange = (range: string) => {
    const { minPrice, maxPrice } = applyPriceRangeValue(range, priceRangeOptions)
    setSearchFilters((prev) => ({ ...prev, minPrice, maxPrice }))
  }

  const searchResultsPath =
    activeTab === 'sale'
      ? (getCMSLinkHref(searchResultsLink ?? {}) ?? HERO_TAB_PATHS.sale)
      : HERO_TAB_PATHS[activeTab]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const nextFilters = normalizePropertyListFilters({
      ...EMPTY_PROPERTY_FILTERS,
      ...searchFilters,
    })
    // Only hand filters to the listing page when something is actually set.
    // Empty defaults should use the page's server-rendered listing.
    if (hasAppliedPropertyFilters(nextFilters)) {
      savePendingPropertyListFilters(nextFilters)
    } else {
      clearPendingPropertyListFilters()
    }
    setMobileSearchOpen(false)
    router.push(searchResultsPath)
  }

  useEffect(() => {
    if (!mobileSearchOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSearchOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [mobileSearchOpen])

  const heroButtons = (buttons ?? []).flatMap((button) => {
    const label = button.label?.trim()
    const href = button.link ? getCMSLinkHref(button.link) : null
    if (!label || !href || !button.link) return []
    return [{ ...button.link, label }]
  })

  const tabs: { id: HeroPropertyTab; label: string }[] = useMemo(() => {
    const allTabs: { id: HeroPropertyTab; label: string }[] = [
      { id: 'sale', label: saleTabLabel },
      { id: 'rental', label: rentalTabLabel },
      { id: 'holiday', label: holidayTabLabel },
    ]
    return allTabs.filter((tab) => visibleTabs.includes(tab.id))
  }, [holidayTabLabel, rentalTabLabel, saleTabLabel, visibleTabs])

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(defaultTab)
      resetFiltersForTab()
    }
  }, [activeTab, defaultTab, resetFiltersForTab, visibleTabs])

  const renderSearchFields = (options: {
    idPrefix: string
    dateOpenDirection?: 'up' | 'down'
    gridClassName: string
  }) => (
    <div className={cn('grid items-end gap-3 p-4 md:gap-3.5 md:p-5 lg:gap-4 lg:p-6', options.gridClassName)}>
      <CoastCityFilterFields
        coast={searchFilters.coast}
        city={searchFilters.city}
        onCoastChange={(value) => handleSearchFilterChange('coast', value)}
        onCityChange={(value) => handleSearchFilterChange('city', value)}
        coasts={coasts}
        coastsLoading={coastsLoading}
        cities={cities}
        citiesLoading={citiesLoading}
        coastId={`${options.idPrefix}-coast`}
        cityId={`${options.idPrefix}-city`}
        triggerClassName={heroSearchFieldClassName}
      />

      {(activeTab === 'sale' || activeTab === 'rental') && (
        <>
          <FilterSelect
            mode="multi"
            label={propertyTypeLabel}
            id={`${options.idPrefix}-type`}
            icon={<Home size={20} strokeWidth={1.75} />}
            options={propertyTypeOptions}
            value={parsePropertyTypeFilter(searchFilters.propertyType)}
            onChange={(value) => handleSearchFilterChange('propertyType', value)}
            emptyLabel={propertyTypeLoading ? loadingTypesLabel : allPropertiesLabel}
            loading={propertyTypeLoading}
            noOptionsLabel={noOptionsFoundLabel}
            triggerClassName={heroSearchFieldClassName}
          />

          <FilterSelect
            label={priceRangeLabel}
            id={`${options.idPrefix}-price`}
            icon={<Banknote size={20} strokeWidth={1.75} />}
            options={priceRangeOptions}
            value={priceRange}
            onChange={handlePriceRangeChange}
            triggerClassName={heroSearchFieldClassName}
          />
        </>
      )}

      {activeTab === 'holiday' && (
        <>
          <DateRangePickerField
            id={`${options.idPrefix}-period-range`}
            label={periodRangeLabel}
            periodFrom={searchFilters.periodFrom ?? ''}
            periodTo={searchFilters.periodTo ?? ''}
            onPeriodFromChange={(value) => handleSearchFilterChange('periodFrom', value)}
            onPeriodToChange={(value) => handleSearchFilterChange('periodTo', value)}
            triggerClassName={heroDateFieldClassName}
            labelClassName="mb-1.5 ml-0.5 block font-label-sm text-label-sm uppercase tracking-[0.08em] text-white/70"
            iconClassName="pointer-events-none text-secondary"
            openDirection={options.dateOpenDirection ?? 'up'}
            panelClassName="rounded-lg border border-outline-variant/40 bg-surface-cream shadow-2xl"
          />
          <CountFilterField
            label={guestsLabel}
            id={`${options.idPrefix}-guests`}
            icon={<Users size={20} strokeWidth={1.75} />}
            options={guestsWithOther}
            value={searchFilters.guests ?? 'any'}
            customValue={searchFilters.guestsCustom ?? ''}
            onChange={(value) => handleSearchFilterChange('guests', value)}
            onCustomChange={handleGuestsCustomChange}
            customPlaceholder={guestsCustomPlaceholder}
            triggerClassName={heroSearchFieldClassName}
            customInputClassName="text-white placeholder:text-white/90"
          />
          <FilterSelect
            label={totalBudgetLabel}
            id={`${options.idPrefix}-budget`}
            icon={<Banknote size={20} strokeWidth={1.75} />}
            options={holidayBudgetOptions}
            value={searchFilters.totalBudget ?? 'any'}
            onChange={(value) => handleSearchFilterChange('totalBudget', value)}
            triggerClassName={heroSearchFieldClassName}
          />
        </>
      )}

      <button type="submit" className={heroSearchButtonClassName}>
        <Search size={16} strokeWidth={2} className="shrink-0 text-on-secondary" aria-hidden />
        <span>{searchLabel}</span>
      </button>
    </div>
  )

  const renderSearchTabs = (layout: 'desktop' | 'mobile') => (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-white/15 px-4 py-3 md:px-5 md:py-3.5 lg:px-6',
        layout === 'desktop' && 'sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        layout === 'mobile' && 'gap-3',
      )}
    >
      {layout === 'mobile' && (
        <div className="flex items-center justify-between gap-3">
          <h2
            id="hero-mobile-search-title"
            className="font-label-nav text-label-nav uppercase tracking-widest text-white"
          >
            {searchFiltersTitle}
          </h2>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-black/25 text-white transition-colors hover:border-secondary/50 hover:bg-black/35"
            aria-label={closeSearchLabel}
          >
            <X size={18} />
          </button>
        </div>
      )}
      {tabs.length > 0 && (
        <div
          className={cn(
            'flex w-full flex-col gap-1',
            layout === 'desktop' &&
              'sm:w-auto lg:inline-flex lg:w-fit lg:flex-row lg:flex-wrap lg:items-center lg:gap-6',
          )}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'w-full cursor-pointer touch-manipulation border-b-2 px-0 py-2.5 text-left font-label-nav text-[11px] uppercase tracking-[0.14em] transition-colors duration-300',
                layout === 'desktop' && 'lg:w-auto lg:py-2 lg:text-center',
                activeTab === tab.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-white/70 hover:text-white',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      <div className={cn(layout === 'desktop' && 'py-0.5 sm:py-0')}>
        <HeroWeather />
      </div>
    </div>
  )

  return (
    <div ref={ref} className="relative">
      <section className="relative flex h-dvh min-h-[100svh] w-full flex-col overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <HeroBackground {...props} />
        </div>
        <div className="absolute inset-0 hero-gradient z-10" aria-hidden />

        {/* Title + CTAs — left-aligned hero copy; padding clears search */}
        <div
          className={cn(
            'relative z-20 flex flex-1 flex-col items-start justify-center text-left',
            heroContainerClassName,
            'pt-[max(5rem,env(safe-area-inset-top))] pb-32 sm:pb-36 lg:pb-44 xl:pb-52',
          )}
        >
          <div className="reveal relative z-20 flex w-full flex-col items-start">
            <div className="flex w-full max-w-[56rem] flex-col items-start">
              {eyebrowText?.trim() ? (
                <div className="mb-4 sm:mb-5">
                  <div className="mb-3 flex items-center gap-2.5" aria-hidden>
                    <span className="h-px w-8 bg-secondary" />
                    <span className="h-1 w-1 rotate-45 bg-secondary" />
                  </div>
                  <p className={heroEyebrowClassName}>
                    {eyebrowText
                      .trim()
                      .replace(/^[—\-|]\s*/, '')}
                  </p>
                </div>
              ) : null}

              <h1 className={heroMainTitleClassName}>{title}</h1>

              {subtitle?.trim() ? (
                <p className={heroSubtitleClassName}>{subtitle.trim()}</p>
              ) : null}
            </div>

            {heroButtons.length > 0 ? (
              <div className="mt-6 flex w-full max-w-[72rem] flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                {heroButtons.map((button, index) => (
                  <CMSLink
                    key={`${button.label}-${index}`}
                    {...button}
                    appearance="inline"
                    className={index === 0 ? heroCtaPrimaryClassName : heroCtaSecondaryClassName}
                  >
                    <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
                  </CMSLink>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {showSearch && (
          <>
            {/* Desktop: inline glass search — only when width fits a full filter row */}
            <div
              className={cn(
                'absolute bottom-[5%] left-0 right-0 z-30 hidden xl:block',
                'xl:bottom-[10%] 2xl:bottom-[12%]',
                heroContainerClassName,
              )}
            >
              <form onSubmit={handleSearchSubmit} className={heroSearchFormClassName}>
                {renderSearchTabs('desktop')}
                {renderSearchFields({
                  idPrefix: 'hero-search',
                  dateOpenDirection: 'up',
                  gridClassName: heroGridClassName[activeTab],
                })}
              </form>
            </div>

            {/* Mobile + tablet: open-search button (avoids cramped multi-column filters) */}
            <div
              className={cn(
                'absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-0 right-0 z-30 xl:hidden',
                'sm:bottom-8',
                heroContainerClassName,
              )}
            >
              <button
                type="button"
                onClick={() => setMobileSearchOpen(true)}
                className={heroMobileOpenButtonClassName}
                aria-haspopup="dialog"
                aria-expanded={mobileSearchOpen}
              >
                <Search size={18} />
                {openSearchLabel}
              </button>
            </div>

            {/* Mobile + tablet: glass filter modal */}
            {mobileSearchOpen && (
              <div
                className="fixed inset-0 z-100 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,env(safe-area-inset-top))] xl:hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="hero-mobile-search-title"
              >
                <button
                  type="button"
                  aria-label={closeSearchLabel}
                  className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                  onClick={() => setMobileSearchOpen(false)}
                />
                <form
                  onSubmit={handleSearchSubmit}
                  className={cn(
                    heroSearchFormClassName,
                    'relative z-10 flex max-h-full w-full max-w-lg flex-col overflow-hidden sm:max-w-2xl',
                  )}
                >
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {renderSearchTabs('mobile')}
                    {renderSearchFields({
                      idPrefix: 'hero-mobile-search',
                      dateOpenDirection: 'down',
                      gridClassName: heroMobileGridClassName,
                    })}
                  </div>
                </form>
              </div>
            )}
          </>
        )}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 hidden flex-col items-center animate-bounce text-white/70">
          <span className="font-label-sm text-label-sm mb-2">{scrollLabel}</span>
          <ChevronDown size={20} />
        </div>
      </section>
    </div>
  )
}

export const HeroBlock: React.FC<Props> = (props) => (
  <PropertyFilterOptionsProvider>
    <HeroBlockContent {...props} />
  </PropertyFilterOptionsProvider>
)
