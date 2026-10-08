'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useSiteLocale } from '@/utilities/useSiteLocale'

import { FilterSelect } from '@/components/FilterSelect'
import { PropertyMapModal } from '@/components/PropertyMap/PropertyMapModal'
import { ArrowUpDown } from 'lucide-react'
import type { Form } from '@/payload-types'
import { PropertyListSaveSearchModal } from './PropertyListSaveSearchModal'
import type { SaveSearchLabelMaps } from '@/utilities/saveSearch'
import { useCRMCoasts } from '@/hooks/useCRMCoasts'
import { useCRMCountries } from '@/hooks/useCRMCountries'
import { useCRMCities } from '@/hooks/useCRMCities'
import { useCRMPropertyTypeOptions } from '@/hooks/useCRMPropertyTypeOptions'
import { PropertyFilterOptionsProvider } from '@/hooks/usePropertyFilterOptions'
import { PropertyCard, resolvePropertyCardStatusBadge } from '@/components/PropertyCard'
import { resolvePropertyDetailFetchStatuses } from '@/utilities/propertyDetailFetchStatus'
import { PropertyCardSkeleton } from '@/components/PropertyCard/PropertyCardSkeleton'
import { SectionEmptyState } from '@/components/SectionEmptyState'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import {
  buildCRMListingQuery,
  fetchCRMProperties,
  fetchCRMPropertiesPost,
  hasHolidayListingFilters,
  shouldUseCRMPropertiesPost,
  normalizeCRMListProperty,
  resolveListingModeFromPreset,
  type CRMListingPreset,
  type NormalizedListProperty,
  type PropertyListFilters,
} from '@/utilities/crmProperties'
import type { SiteCountryTransaction } from '@/utilities/siteCountries.shared'
import {
  buildCRMProjectsQuery,
  fetchCRMProjects,
  normalizeCRMProject,
} from '@/utilities/crmProjects'
import { ProjectCard } from '@/components/ProjectCard'
import { hasMapAreaReferences } from '@/utilities/propertyMapFilters'
import { DEFAULT_PROPERTY_FILTER_OPTIONS } from '@/utilities/propertyFilterOptions.shared'
import {
  EMPTY_PROPERTY_FILTERS,
  hasAppliedPropertyFilters,
  parseCountryFilter,
} from './filterOptions'
import { resolvePreselectedCountryKeys } from '@/utilities/crmCountries'
import { useSortOptions } from './useFilterOptionLabels'
import { PropertyListFilters as FiltersBar } from './PropertyListFilters'
import { PropertyListPagination } from './PropertyListPagination'
import {
  clearPendingPropertyListFilters,
  normalizePropertyListFilters,
  stripPropertyFilterSearchParams,
  takePendingPropertyListFilters,
  appendListingContextToDetailHref,
} from './propertyFilterUrl'
import {
  listingContextToListingMode,
  resolvePropertyDetailListingContext,
  type PropertyDetailListingContext,
} from '@/utilities/propertyDetailListingContext'
import { resolveHolidayGuestsFilterCount } from '@/utilities/crmHoliday'
import { withRentalPriceFromPrefix } from '@/utilities/localizePropertyPrice'
import {
  buildPropertyListListingHref,
  parseOrderbyEntriesFromSearchParams,
  parsePropertyListPage,
  parsePropertyListSort,
  stripOrderbyFromListingHref,
} from './propertyListUrl'
import type { PropertyListInitialData } from './PropertyListServerData'
import { useTranslation } from '@/utilities/translateClient'
import { cn } from '@/utilities/ui'

export type { PropertyListInitialData } from './PropertyListServerData'

type Props = {
  listingPreset: CRMListingPreset
  /** When listingPreset is `cityWise`, CRM city key for `city: { $in: [id] }`. */
  crmCity?: number | null
  crmQueryJson?: string | null
  pageSize?: number | null
  showFilters?: boolean | null
  showMap?: boolean | null
  forceSoldBadge?: boolean | null
  resultsLabel?: string | null
  emptyStateNoFavoritesTitle?: string | null
  emptyStateNoFavoritesDescription?: string | null
  emptyStateNoResultsTitle?: string | null
  emptyStateNoResultsDescription?: string | null
  initialData?: PropertyListInitialData | null
  listingKey?: string
  /** Default listing pages: server fetch + URL pagination (filters/favorites stay client-driven). */
  serverManaged?: boolean
  contactForm?: Form | null
}

const DEFAULT_PAGE_SIZE = 9
const FALLBACK_SORT_OPTIONS = DEFAULT_PROPERTY_FILTER_OPTIONS.sortOptions
const FALLBACK_DEFAULT_SORT = FALLBACK_SORT_OPTIONS[0]?.value ?? 'recent'

export type FavoritesListTab = 'properties' | 'projects'

export const FAVORITES_TAB_QUERY_KEY = 'fav'

export function parseFavoritesListTab(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): FavoritesListTab {
  const raw = searchParams.get(FAVORITES_TAB_QUERY_KEY)?.trim().toLowerCase()
  if (raw === 'projects' || raw === 'project') return 'projects'
  return 'properties'
}

export const PropertyListView: React.FC<Props> = (props) => (
  <PropertyFilterOptionsProvider>
    <PropertyListViewInner {...props} />
  </PropertyFilterOptionsProvider>
)

const PropertyListViewInner: React.FC<Props> = ({
  listingPreset,
  crmCity,
  crmQueryJson,
  pageSize: pageSizeProp,
  showFilters = true,
  showMap = false,
  forceSoldBadge,
  resultsLabel,
  emptyStateNoFavoritesTitle,
  emptyStateNoFavoritesDescription,
  emptyStateNoResultsTitle,
  emptyStateNoResultsDescription,
  contactForm,
  initialData,
  listingKey = '',
  serverManaged = false,
}) => {
  const pageSize = Math.max(1, pageSizeProp ?? DEFAULT_PAGE_SIZE)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeLocale = useSiteLocale()
  const sortOptions = useSortOptions()
  const [isNavigating, startTransition] = useTransition()

  const [pendingFiltersApplied, setPendingFiltersApplied] = useState(false)
  const [filtersHydrated, setFiltersHydrated] = useState(false)
  const [filters, setFilters] = useState<PropertyListFilters>(EMPTY_PROPERTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PropertyListFilters>(EMPTY_PROPERTY_FILTERS)
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [saveSearchOpen, setSaveSearchOpen] = useState(false)

  const { propertyFavoriteIds, projectFavoriteIds, propertyCount, projectCount } =
    usePropertyFavorites()
  const isFavoritesList = listingPreset === 'favorites'
  const favoritesTab = useMemo(
    () => (isFavoritesList ? parseFavoritesListTab(searchParams) : 'properties'),
    [isFavoritesList, searchParams],
  )
  const isFavoritesProjectsTab = isFavoritesList && favoritesTab === 'projects'
  const isFavoritesPropertiesTab = isFavoritesList && favoritesTab === 'properties'
  const activeFavoriteIds = isFavoritesProjectsTab ? projectFavoriteIds : propertyFavoriteIds
  const filtersAreApplied = hasAppliedPropertyFilters(appliedFilters)

  const sortOptionsForUrl = sortOptions.length ? sortOptions : FALLBACK_SORT_OPTIONS
  const defaultListSort = sortOptionsForUrl[0]?.value ?? FALLBACK_DEFAULT_SORT
  const sortFromUrl = useMemo(
    () => parsePropertyListSort(searchParams, FALLBACK_DEFAULT_SORT, sortOptionsForUrl),
    [searchParams, sortOptionsForUrl],
  )

  const [page, setPage] = useState(initialData?.page ?? parsePropertyListPage(searchParams))
  const [sort, setSort] = useState(initialData?.sort ?? sortFromUrl ?? FALLBACK_DEFAULT_SORT)
  const [rawProperties, setRawProperties] = useState<Record<string, unknown>[]>(
    initialData?.properties ?? [],
  )
  const [total, setTotal] = useState(initialData?.total ?? 0)

  const isServerManaged =
    serverManaged &&
    !isFavoritesList &&
    !filtersAreApplied &&
    !pendingFiltersApplied &&
    sort === defaultListSort

  const [loading, setLoading] = useState(isServerManaged ? !initialData : !initialData)
  const serverDataReady =
    Boolean(initialData) &&
    (!listingKey || !initialData?.listingKey || initialData.listingKey === listingKey)
  const showSkeleton =
    loading || (isServerManaged && isNavigating) || (isServerManaged && !serverDataReady)

  const filterPreset: CRMListingPreset = isFavoritesProjectsTab
    ? 'projects'
    : isFavoritesList
      ? 'forSale'
      : listingPreset
  const filtersListingPreset: CRMListingPreset = isFavoritesProjectsTab
    ? 'projects'
    : listingPreset
  const mapEnabled = showMap === true && !isFavoritesProjectsTab
  const hasFavoriteIds = activeFavoriteIds.length > 0
  const favoriteIdsKey = JSON.stringify(activeFavoriteIds)

  const { options: propertyTypeOptions, loading: propertyTypeLoading } =
    useCRMPropertyTypeOptions(filterPreset)
  const countriesTransaction: SiteCountryTransaction =
    filterPreset === 'forRent' ? 'rental' : filterPreset === 'forHoliday' ? 'holiday' : 'sale'

  const { countries, loading: countriesLoading } = useCRMCountries(countriesTransaction)
  const { coasts, loading: coastsLoading } = useCRMCoasts(filters.country)
  const { cities, loading: citiesLoading } = useCRMCities(filters.coast, coasts, filterPreset)
  const sortParams = useMemo(
    () => sortOptions.find((option) => option.value === sort)?.sort,
    [sort, sortOptions],
  )
  const sortParamsKey = useMemo(() => JSON.stringify(sortParams ?? {}), [sortParams])
  const stableSortParams = useMemo<Record<string, unknown> | undefined>(() => {
    if (sortParamsKey === '{}' || !sortParamsKey) return undefined
    try {
      return JSON.parse(sortParamsKey) as Record<string, unknown>
    } catch {
      return undefined
    }
  }, [sortParamsKey])

  const favoritesSyncReadyRef = useRef(false)
  const pageAdjustedByFavoritesSyncRef = useRef(false)
  const fetchGenerationRef = useRef(0)
  const orderbyStrippedRef = useRef(false)

  const displayTotal =
    isFavoritesList && hasFavoriteIds && !filtersAreApplied
      ? activeFavoriteIds.length
      : total
  const totalPages = Math.max(1, Math.ceil(displayTotal / pageSize))

  const getListingHref = useCallback(
    (updates: { page?: number; sort?: string | null; fav?: FavoritesListTab | null }) => {
      const href = buildPropertyListListingHref(pathname, updates, searchParams, sortOptionsForUrl)
      if (!isFavoritesList || updates.fav === undefined) return href

      const [path, query = ''] = href.split('?')
      const params = new URLSearchParams(query)
      if (updates.fav === null) {
        params.delete(FAVORITES_TAB_QUERY_KEY)
      } else {
        params.set(FAVORITES_TAB_QUERY_KEY, updates.fav)
      }
      const qs = params.toString()
      return qs ? `${path}?${qs}` : path
    },
    [isFavoritesList, pathname, searchParams, sortOptionsForUrl],
  )

  const navigateServerListing = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      setLoading(true)
      startTransition(() => {
        router.push(href, { scroll: options?.scroll ?? false })
      })
    },
    [router],
  )

  const properties = useMemo(() => {
    if (isFavoritesProjectsTab || listingPreset === 'projects') {
      return [] as Array<
        NormalizedListProperty & { listingContext?: PropertyDetailListingContext }
      >
    }

    const holidayGuestCount = resolveHolidayGuestsFilterCount(
      appliedFilters.guests,
      appliedFilters.guestsCustom,
    )
    const presetHolidayList =
      listingPreset === 'forHoliday' || hasHolidayListingFilters(appliedFilters)

    return rawProperties.map((raw) => {
      const listingContext = resolvePropertyDetailListingContext(listingPreset, raw)
      const listingMode =
        listingContextToListingMode(listingContext) ?? resolveListingModeFromPreset(listingPreset)
      const isHolidayList = listingContext === 'forHoliday' || presetHolidayList

      const normalized = normalizeCRMListProperty(raw, activeLocale, {
        listingMode,
        projectListing: false,
        holidayListing: isHolidayList,
        holidayPeriodFrom: appliedFilters.periodFrom,
        holidayPeriodTo: appliedFilters.periodTo,
        holidayGuests: holidayGuestCount != null ? String(holidayGuestCount) : undefined,
      })

      return { ...normalized, listingContext }
    })
  }, [activeLocale, appliedFilters, isFavoritesProjectsTab, listingPreset, rawProperties])

  const projects = useMemo(() => {
    if (listingPreset !== 'projects' && !isFavoritesProjectsTab) return []
    return rawProperties.map((raw) => normalizeCRMProject(raw, activeLocale))
  }, [activeLocale, isFavoritesProjectsTab, listingPreset, rawProperties])

  const saveSearchLabelMaps = useMemo((): SaveSearchLabelMaps => {
    const coastMap: Record<string, string> = {}
    for (const coast of coasts) {
      if (coast.value) coastMap[coast.value] = coast.label
    }
    const cityMap: Record<string, string> = {}
    for (const city of cities) {
      if (city.value) cityMap[city.value] = city.label
    }
    const countryMap: Record<string, string> = {}
    for (const country of countries) {
      if (country.value) countryMap[country.value] = country.label
    }
    const propertyTypeMap: Record<string, string> = {}
    for (const option of propertyTypeOptions) {
      if (option.value) propertyTypeMap[option.value] = option.label
    }
    return {
      coasts: coastMap,
      cities: cityMap,
      countries: countryMap,
      propertyTypes: propertyTypeMap,
    }
  }, [cities, coasts, countries, propertyTypeOptions])

  const sortByLabel = useTranslation('propertyList.filters.sortBy', 'Sort by')
  const showingLabel = useTranslation('propertyList.results.showing', 'Showing')
  /** CMS `resultsLabel` is source of truth; English only if the block field is empty. */
  const defaultResultsLabel = 'extraordinary properties'
  const projectsResultsLabel = useTranslation('propertyList.results.projects', 'projects')
  const favoritesPropertiesTabLabel = useTranslation('favorites.tabs.property', 'Property')
  const favoritesProjectsTabLabel = useTranslation('favorites.tabs.project', 'Project')
  const favoritesEyebrow = useTranslation('propertyList.emptyState.favoritesEyebrow', 'Favorites')
  const collectionsEyebrow = useTranslation(
    'propertyList.emptyState.collectionsEyebrow',
    'Collections',
  )

  // Favorites empty copy: Property List block CMS (localized + DeepL). No Translations keys.
  const cmsNoFavoritesTitle = emptyStateNoFavoritesTitle?.trim() || 'No favorites yet'
  const cmsNoFavoritesDescription =
    emptyStateNoFavoritesDescription?.trim() ||
    "You haven't favorited any properties yet. Browse our listings and tap the star on any property to save it here."
  const cmsNoMatchingFavoritesTitle = emptyStateNoResultsTitle?.trim() || 'No matching favorites'
  const cmsNoMatchingFavoritesDescription =
    emptyStateNoResultsDescription?.trim() ||
    'None of your saved properties match these filters. Try adjusting your search or add more favorites from our listings.'

  const noProjectFavoritesTitle = useTranslation(
    'propertyList.emptyState.noProjectFavoritesTitle',
    'No project favorites yet',
  )
  const noProjectFavoritesDescription = useTranslation(
    'propertyList.emptyState.noProjectFavoritesDescription',
    "You haven't favorited any projects yet. Browse our projects and tap the star on any project to save it here.",
  )
  const noMatchingProjectFavoritesDescription = useTranslation(
    'propertyList.emptyState.noMatchingProjectFavoritesDescription',
    'None of your saved projects match these filters. Try adjusting your search or add more favorites from our projects.',
  )
  const noPropertiesTitle = useTranslation(
    'propertyList.emptyState.noPropertiesTitle',
    'No properties found',
  )
  const noPropertiesDescription = useTranslation(
    'propertyList.emptyState.noPropertiesDescription',
    'We could not find any listings for this selection. Try adjusting your filters or check again soon.',
  )
  const noProjectsTitle = useTranslation(
    'propertyList.emptyState.noProjectsTitle',
    'No projects found',
  )
  const noProjectsDescription = useTranslation(
    'propertyList.emptyState.noProjectsDescription',
    'We could not find any projects for this selection. Try adjusting your filters or check again soon.',
  )
  const isProjectsList = listingPreset === 'projects' || isFavoritesProjectsTab
  const emptyResultsTitle = isProjectsList ? noProjectsTitle : noPropertiesTitle
  const emptyResultsDescription = isProjectsList ? noProjectsDescription : noPropertiesDescription
  const resolvedResultsLabel = isFavoritesProjectsTab
    ? projectsResultsLabel
    : resultsLabel?.trim() || defaultResultsLabel
  const emptyFavoritesTitle = isFavoritesProjectsTab
    ? noProjectFavoritesTitle
    : cmsNoFavoritesTitle
  const emptyFavoritesDescription = isFavoritesProjectsTab
    ? noProjectFavoritesDescription
    : cmsNoFavoritesDescription
  const emptyMatchingFavoritesDescription = isFavoritesProjectsTab
    ? noMatchingProjectFavoritesDescription
    : cmsNoMatchingFavoritesDescription
  const emptyMatchingFavoritesTitle = cmsNoMatchingFavoritesTitle

  /** Apply server-rendered listing (page, sort, properties). */
  useEffect(() => {
    if (!isServerManaged) return

    if (!initialData || !serverDataReady) {
      setLoading(true)
      return
    }

    setPage(initialData.page)
    setSort(initialData.sort || sortFromUrl || FALLBACK_DEFAULT_SORT)
    setRawProperties(initialData.properties)
    setTotal(initialData.total)
    setLoading(false)
  }, [initialData, isServerManaged, serverDataReady, sortFromUrl])

  /** Remove orderby[] from the URL — sort is kept in component state only. */
  useEffect(() => {
    if (orderbyStrippedRef.current) return

    const orderbyEntries = parseOrderbyEntriesFromSearchParams(searchParams)
    if (!orderbyEntries.length) {
      orderbyStrippedRef.current = true
      return
    }

    const fromUrl = parsePropertyListSort(searchParams, FALLBACK_DEFAULT_SORT, sortOptionsForUrl)
    setSort(fromUrl)
    orderbyStrippedRef.current = true
    router.replace(stripOrderbyFromListingHref(pathname, searchParams), { scroll: false })
  }, [pathname, router, searchParams, sortOptionsForUrl])

  /** Hero search → listing: sessionStorage filters (client fetch only). */
  useEffect(() => {
    const pending = takePendingPropertyListFilters()
    // Default/empty hero searches must stay on the server-rendered listing.
    // Treating them as "pending" disables server mode without triggering a
    // client fetch (filtersAreApplied is false), which yields 0 results.
    if (pending && hasAppliedPropertyFilters(pending)) {
      setPendingFiltersApplied(true)
      setFilters(pending)
      setAppliedFilters(pending)
      setPage(1)
      // Avoid showing the server-prefetched default list while we fetch
      // using the Hero-selected pending filters.
      setRawProperties([])
      setTotal(0)
      setLoading(true)
    } else if (pending) {
      clearPendingPropertyListFilters()
    }
    stripPropertyFilterSearchParams()
    setFiltersHydrated(true)
  }, [])

  /**
   * Pre-select the country in the filter UI: the CMS default when it is enabled for this
   * transaction type, otherwise the first available country. Only touches the pending
   * filter state so the server-rendered listing is untouched until the user searches.
   */
  const countryPreselectedRef = useRef(false)
  useEffect(() => {
    if (countryPreselectedRef.current) return
    if (!filtersHydrated || countriesLoading || !countries.length) return

    countryPreselectedRef.current = true
    const preselected = resolvePreselectedCountryKeys(countries)
    if (!preselected.length) return

    setFilters((prev) => {
      if (parseCountryFilter(prev.country).length) return prev
      return { ...prev, country: preselected }
    })
  }, [countries, countriesLoading, filtersHydrated])

  /** Client CRM fetch — favorites and filtered listings only. */
  useEffect(() => {
    if (!filtersHydrated || isServerManaged) return

    if (isFavoritesList && activeFavoriteIds.length === 0) {
      setRawProperties([])
      setTotal(0)
      setLoading(false)
      return
    }

    const sortTriggersClientFetch =
      sort !== defaultListSort ||
      filtersAreApplied ||
      hasMapAreaReferences(appliedFilters) ||
      (isFavoritesList && activeFavoriteIds.length > 0)

    if (!sortTriggersClientFetch) {
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const generation = ++fetchGenerationRef.current

    const load = async () => {
      const showSkeleton = !(isFavoritesList && pageAdjustedByFavoritesSyncRef.current)
      pageAdjustedByFavoritesSyncRef.current = false
      if (showSkeleton) setLoading(true)

      try {
        if (listingPreset === 'projects' || isFavoritesProjectsTab) {
          const listingBody = buildCRMProjectsQuery({
            page,
            pageSize,
            filters: appliedFilters,
            sortParams: stableSortParams,
          })
          const result = await fetchCRMProjects({
            body: listingBody,
            signal: controller.signal,
            locale: activeLocale,
            projectIds: isFavoritesProjectsTab
              ? activeFavoriteIds.map(String)
              : hasMapAreaReferences(appliedFilters)
                ? appliedFilters.mapReferences
                : undefined,
          })
          if (controller.signal.aborted || generation !== fetchGenerationRef.current) return

          setRawProperties(result.properties as Record<string, unknown>[])
          setTotal(result.total)
        } else {
          const usePostListing = shouldUseCRMPropertiesPost({
            filters: appliedFilters,
            preset: listingPreset,
            favoriteIds: isFavoritesPropertiesTab ? activeFavoriteIds : undefined,
          })
          const listingBody = buildCRMListingQuery({
            preset: listingPreset,
            crmCity,
            crmQueryJson,
            page,
            pageSize,
            filters: appliedFilters,
            restrictToFavoriteIds: isFavoritesPropertiesTab ? activeFavoriteIds : undefined,
            sortParams: stableSortParams,
          })
          const postReason = isFavoritesPropertiesTab
            ? 'favorites'
            : hasMapAreaReferences(appliedFilters)
              ? 'map-area'
              : appliedFilters.reference?.trim()
                ? 'reference'
                : listingPreset === 'forHoliday' || hasHolidayListingFilters(appliedFilters)
                  ? 'holiday'
                  : undefined
          const result = usePostListing
            ? await fetchCRMPropertiesPost({
                body: listingBody,
                signal: controller.signal,
                reason: postReason,
              })
            : await fetchCRMProperties({ body: listingBody, signal: controller.signal })
          if (controller.signal.aborted || generation !== fetchGenerationRef.current) return

          setRawProperties(result.properties as Record<string, unknown>[])
          setTotal(result.total)
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to load property list', error)
          if (generation === fetchGenerationRef.current) {
            setRawProperties([])
            setTotal(0)
          }
        }
      } finally {
        if (generation === fetchGenerationRef.current) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [
    activeFavoriteIds,
    activeLocale,
    appliedFilters,
    crmCity,
    crmQueryJson,
    favoriteIdsKey,
    filtersHydrated,
    isFavoritesList,
    isFavoritesProjectsTab,
    isFavoritesPropertiesTab,
    isServerManaged,
    listingPreset,
    page,
    pageSize,
    sort,
    sortParamsKey,
    stableSortParams,
    defaultListSort,
    filtersAreApplied,
  ])

  /** Favorites: adjust page after unfavoriting. */
  useEffect(() => {
    if (!isFavoritesList || isServerManaged) {
      favoritesSyncReadyRef.current = false
      return
    }

    if (!favoritesSyncReadyRef.current) {
      favoritesSyncReadyRef.current = true
      return
    }

    if (activeFavoriteIds.length === 0) {
      setRawProperties([])
      setTotal(0)
      setLoading(false)
      return
    }

    const lastValidPage = Math.max(1, Math.ceil(activeFavoriteIds.length / pageSize))
    if (page > lastValidPage) {
      pageAdjustedByFavoritesSyncRef.current = true
      setPage(lastValidPage)
    }
  }, [activeFavoriteIds.length, favoriteIdsKey, isFavoritesList, isServerManaged, page, pageSize])

  /** Favorites: reset page/filters when switching Property / Project tabs. */
  const favoritesTabRef = useRef(favoritesTab)
  useEffect(() => {
    if (!isFavoritesList) return
    if (favoritesTabRef.current === favoritesTab) return
    favoritesTabRef.current = favoritesTab
    setFilters(EMPTY_PROPERTY_FILTERS)
    setAppliedFilters(EMPTY_PROPERTY_FILTERS)
    setPendingFiltersApplied(false)
    setPage(1)
    setRawProperties([])
    setTotal(0)
    // Empty tabs stay at 0 — avoid a loading "…" flash on tab change.
    setLoading(activeFavoriteIds.length > 0)
  }, [activeFavoriteIds.length, favoritesTab, isFavoritesList])

  const handleFilterChange = useCallback(
    (key: keyof PropertyListFilters, value: PropertyListFilters[keyof PropertyListFilters]) => {
      setFilters((prev) => {
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
    },
    [],
  )

  const handleApply = (nextFilters: PropertyListFilters) => {
    clearPendingPropertyListFilters()
    const normalized = normalizePropertyListFilters({
      ...filters,
      ...nextFilters,
    })
    const nextFiltersApplied = hasAppliedPropertyFilters(normalized)
    // Drop hero-pending mode so Clear can return to the default server listing.
    // Leaving this true after empty filters skips the default fetch and keeps stale results.
    setPendingFiltersApplied(false)
    setFilters(normalized)
    setAppliedFilters(normalized)
    setPage(1)
    setLoading(true)

    const willBeServerManaged =
      serverManaged && !isFavoritesList && !nextFiltersApplied && sort === defaultListSort

    if (willBeServerManaged || isServerManaged) {
      router.replace(getListingHref({ page: 1, sort: null }), { scroll: false })
    }
  }

  const handleSortChange = (nextSort: string) => {
    setSort(nextSort)
    setPage(1)
    setLoading(true)
    router.replace(getListingHref({ page: 1 }), { scroll: false })
  }

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return

    if (isServerManaged) {
      navigateServerListing(getListingHref({ page: nextPage }), { scroll: true })
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      return
    }

    setPage(nextPage)
    setLoading(true)
    router.replace(getListingHref({ page: nextPage }), { scroll: false })
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }

  const handleMapDrawApply = (references: string[]) => {
    const nextFilters: PropertyListFilters = {
      ...appliedFilters,
      mapReferences: references,
      reference: '',
    }
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setPage(1)
    setLoading(true)
    if (isServerManaged) {
      router.replace(getListingHref({ page: 1, sort: null }), { scroll: false })
    }
  }

  const resultsText = useMemo(() => {
    return (
      <>
        {showingLabel}{' '}
        <span className="font-bold text-on-surface">{showSkeleton ? '…' : displayTotal}</span>{' '}
        {resolvedResultsLabel}
      </>
    )
  }, [displayTotal, showSkeleton, resolvedResultsLabel, showingLabel])

  const handleFavoritesTabChange = (nextTab: FavoritesListTab) => {
    if (nextTab === favoritesTab) return
    startTransition(() => {
      router.replace(getListingHref({ page: 1, fav: nextTab }), { scroll: false })
    })
  }

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pb-12">
      {isFavoritesList && (
        <div
          role="tablist"
          aria-label="Favorites"
          className="mb-8 flex flex-wrap gap-6 border-b border-secondary/25"
        >
          {(
            [
              {
                id: 'properties' as const,
                label: favoritesPropertiesTabLabel,
                count: propertyCount,
              },
              {
                id: 'projects' as const,
                label: favoritesProjectsTabLabel,
                count: projectCount,
              },
            ] as const
          ).map((tab) => {
            const selected = favoritesTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`${tab.label} (${tab.count})`}
                id={`favorites-tab-${tab.id}`}
                onClick={() => handleFavoritesTabChange(tab.id)}
                className={cn(
                  'relative -mb-px cursor-pointer pb-3 font-label-nav text-[12px] uppercase tracking-[0.14em] transition-colors',
                  selected
                    ? 'border-b-2 border-secondary text-primary'
                    : 'border-b-2 border-transparent text-on-surface/50 hover:text-primary',
                )}
              >
                {tab.label}
                <span className="ml-1.5 tabular-nums">({tab.count})</span>
              </button>
            )
          })}
        </div>
      )}

      {showFilters !== false && (
        <FiltersBar
          listingPreset={filtersListingPreset}
          filters={filters}
          appliedFilters={appliedFilters}
          onChange={handleFilterChange}
          onApply={handleApply}
          showMap={mapEnabled}
          onOpenMap={() => setMapModalOpen(true)}
          onOpenSaveSearch={() => setSaveSearchOpen(true)}
          propertyTypeOptions={propertyTypeOptions}
          propertyTypeLoading={propertyTypeLoading}
          countries={countries}
          countriesLoading={countriesLoading}
          coasts={coasts}
          coastsLoading={coastsLoading}
          cities={cities}
          citiesLoading={citiesLoading}
        />
      )}

      <section className="mb-8 flex flex-col items-end justify-between gap-4 border-b border-secondary/25 pb-5 md:mb-10 md:flex-row md:items-center">
        <div className="font-body-md text-[15px] font-light tracking-[0.01em] text-on-surface-variant md:text-base">
          {resultsText}
        </div>
        <FilterSelect
          label={sortByLabel}
          id="property-list-sort"
          icon={<ArrowUpDown size={18} strokeWidth={1.75} />}
          options={sortOptions}
          value={sort}
          onChange={(value) => handleSortChange(value)}
          className="w-full md:w-auto md:min-w-[220px]"
        />
      </section>

      {isFavoritesList && !hasFavoriteIds ? (
        <div className="mb-20">
          <SectionEmptyState
            eyebrow={favoritesEyebrow}
            title={emptyFavoritesTitle}
            description={emptyFavoritesDescription}
            tone="surface"
          />
        </div>
      ) : showSkeleton ? (
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-3 lg:gap-8">
          {Array.from({ length: pageSize }).map((_, i) => (
            <PropertyCardSkeleton key={i} animationDelay={(i % 3) * 0.12} />
          ))}
        </div>
      ) : isProjectsList && projects.length > 0 ? (
        <section className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-3 lg:gap-8">
          {projects.map((project) => (
            <ProjectCard
              key={project.id ?? project.reference ?? project.title}
              projectId={project.id}
              href={project.detailHref}
              project={project}
            />
          ))}
        </section>
      ) : properties.length > 0 ? (
        <section className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-3 lg:gap-8">
          {properties.map((property) => {
            const cardListingContext = property.listingContext
            return (
              <PropertyCard
                key={property.id ?? property.reference ?? property.title}
                propertyId={property.id}
                href={appendListingContextToDetailHref(
                  property.detailHref,
                  cardListingContext,
                  cardListingContext === 'forHoliday' ? appliedFilters : undefined,
                )}
                detailListingContext={cardListingContext}
                property={{
                  imageUrl: property.imageUrl,
                  imageUrls: property.imageUrls,
                  location: property.location,
                  city: property.city,
                  reference: property.reference,
                  displayReference: property.displayReference,
                  title: property.title,
                  beds: property.beds,
                  baths: property.baths,
                  sqft: property.sqft,
                  price:
                    cardListingContext === 'forHoliday'
                      ? withRentalPriceFromPrefix(property.price)
                      : property.price,
                  priceSubtext: property.holidayPriceSummary,
                  statusBadgeLabel: property.statusBadgeLabel,
                }}
                statusBadgeLabel={resolvePropertyCardStatusBadge({
                  statusBadgeLabel: property.statusBadgeLabel,
                  forceSoldBadge: Boolean(forceSoldBadge),
                  useCrmStatus: true,
                })}
                detailFetchStatuses={resolvePropertyDetailFetchStatuses({
                  crmStatus: property.crmStatus,
                  statusBadgeLabel: property.statusBadgeLabel,
                  forceSold: Boolean(forceSoldBadge),
                })}
                variant="surface"
              />
            )
          })}
        </section>
      ) : (
        <div className="mb-20">
          <SectionEmptyState
            eyebrow={isFavoritesList ? favoritesEyebrow : collectionsEyebrow}
            title={
              isFavoritesList
                ? emptyMatchingFavoritesTitle
                : emptyStateNoResultsTitle?.trim() || emptyResultsTitle
            }
            description={
              isFavoritesList
                ? emptyMatchingFavoritesDescription
                : emptyStateNoResultsDescription?.trim() || emptyResultsDescription
            }
            tone="surface"
          />
        </div>
      )}

      <PropertyListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        disabled={showSkeleton}
      />

      {mapEnabled && (
        <PropertyMapModal
          open={mapModalOpen}
          onClose={() => setMapModalOpen(false)}
          listingPreset={listingPreset}
          crmCity={crmCity}
          crmQueryJson={crmQueryJson}
          appliedFilters={appliedFilters}
          favoriteIds={isFavoritesPropertiesTab ? activeFavoriteIds : undefined}
          onDrawApply={handleMapDrawApply}
        />
      )}

      <PropertyListSaveSearchModal
        open={saveSearchOpen}
        onClose={() => setSaveSearchOpen(false)}
        contactForm={contactForm}
        filters={filters}
        listingPreset={filtersListingPreset}
        labelMaps={saveSearchLabelMaps}
      />
    </div>
  )
}
