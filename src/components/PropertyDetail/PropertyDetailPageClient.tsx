'use client'

import { notFound, useSearchParams } from 'next/navigation'
import { useParams } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { PropertyDetailView } from '@/components/PropertyDetail/PropertyDetailView'
import { Skeleton } from '@/components/ui/skeleton'
import { normalizeCRMAmenities, normalizeCRMPropertyEnergy } from '@/utilities/crmAmenities'
import { fetchCRMPropertyDetail } from '@/utilities/crmPropertyDetail'
import { fetchCRMProjectDetail } from '@/utilities/crmProjects'
import {
  resolvePropertyDetailFetchStatuses,
  takePropertyDetailFetchStatus,
} from '@/utilities/propertyDetailFetchStatus'
import {
  parsePropertyDetailForQuery,
  resolveDetailListingContextFromProperty,
  resolvePropertyDetailHolidayMode,
  takePropertyDetailListingContext,
  listingContextToListingMode,
} from '@/utilities/propertyDetailListingContext'
import {
  fetchCRMSimilarProperties,
  isSimilarPropertySold,
  resolveSimilarListingContext,
} from '@/utilities/crmSimilarProperties'
import type { Form } from '@/payload-types'
import { normalizeCRMListProperty, normalizeCRMProperty } from '@/utilities/crmProperties'
import { parseCRMPropertyBookings } from '@/utilities/crmHoliday'
import {
  DEFAULT_MINIMUM_STAY,
  parseRentalSeasons,
  resolvePropertyMinimumStay,
  resolvePropertySecurityDeposit,
} from '@/utilities/holidayRentalPricing'
import {
  extractPropertyInquiryContext,
  type PropertyInquiryContext,
} from '@/utilities/propertyInquiry'
import { PROPERTY_DETAIL_IMAGE_SIZE } from '@/utilities/optimaImage'
import { resolveCRMPropertyVideos } from '@/utilities/crmPropertyVideo'
import { resolveCRMPropertyDocuments } from '@/utilities/crmPropertyDocuments'
import { buildPropertyBrochurePdfUrl } from '@/utilities/propertyBrochure'
import { extractReferenceFromSlug } from '@/utilities/propertyUrl'
import { useSiteLocale } from '@/utilities/useSiteLocale'
import { formatPageTitle } from '@/utilities/getAppName'

const pickNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

/** Fetch/abort rejections are not always named `AbortError` across browsers. */
const isAbortError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const err = error as { name?: string; code?: number }
  return err.name === 'AbortError' || err.code === 20
}

function PropertyDetailSkeleton() {
  return (
    <main className="bg-surface-cream pt-28">
      <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="mb-24 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <Skeleton className="aspect-[4/3] rounded-xl lg:col-span-7 xl:col-span-8" />
          <div className="space-y-6 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/80 p-6 lg:col-span-5 xl:col-span-4">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-16 w-full rounded" />
            <Skeleton className="h-8 w-40 rounded" />
            <Skeleton className="h-12 w-56 rounded" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-4/6 rounded" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

type Props = {
  contactForm?: Form | null
  /** `project` uses constructions/view-by-ref and skips similar commercial properties. */
  entityType?: 'property' | 'project'
}

export const PropertyDetailPageClient: React.FC<Props> = ({
  contactForm,
  entityType = 'property',
}) => {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const activeLocale = useSiteLocale()
  const isProject = entityType === 'project'
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)
  const loadSeqRef = useRef(0)

  const [property, setProperty] = useState<ReturnType<typeof normalizeCRMProperty> | null>(null)
  const [amenities, setAmenities] = useState<ReturnType<typeof normalizeCRMAmenities>>([])
  const [energy, setEnergy] = useState<ReturnType<typeof normalizeCRMPropertyEnergy>>(null)
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [relatedProperties, setRelatedProperties] = useState<
    ReturnType<typeof normalizeCRMListProperty>[]
  >([])
  const [similarPropertiesLoading, setSimilarPropertiesLoading] = useState(false)
  const [showSimilarSoldBadge, setShowSimilarSoldBadge] = useState(false)
  const [brochureUrl, setBrochureUrl] = useState<string | undefined>()
  const [videos, setVideos] = useState<ReturnType<typeof resolveCRMPropertyVideos>>([])
  const [documents, setDocuments] = useState<ReturnType<typeof resolveCRMPropertyDocuments>>([])
  const [inquiry, setInquiry] = useState<PropertyInquiryContext>({})
  const [isHolidayRental, setIsHolidayRental] = useState(false)
  const [rentalSeasons, setRentalSeasons] = useState<ReturnType<typeof parseRentalSeasons>>([])
  const [minimumStay, setMinimumStay] = useState(DEFAULT_MINIMUM_STAY)
  const [securityDeposit, setSecurityDeposit] = useState<number | undefined>()
  const [bookings, setBookings] = useState<ReturnType<typeof parseCRMPropertyBookings>>([])
  const [bookingsRefreshing, setBookingsRefreshing] = useState(false)

  const slug = decodeURIComponent(params.slug ?? '')

  /** Soft-refresh holiday bookings/calendar without remounting the whole page. */
  const refreshBookings = useCallback(async () => {
    if (isProject) return

    const reference = extractReferenceFromSlug(slug)
    if (!reference) return

    setBookingsRefreshing(true)
    try {
      const statuses = resolvePropertyDetailFetchStatuses({
        crmStatus: property?.crmStatus,
        statusBadgeLabel: property?.statusBadgeLabel,
      })
      let raw = await fetchCRMPropertyDetail(reference, { statuses })
      if (!raw && !statuses?.length) {
        raw = await fetchCRMPropertyDetail(reference, { statuses: ['Sold'] })
      }
      if (!raw) return

      setBookings(parseCRMPropertyBookings(raw))
      setRentalSeasons(parseRentalSeasons(raw))
      setMinimumStay(resolvePropertyMinimumStay(raw))
      setSecurityDeposit(resolvePropertySecurityDeposit(raw))
    } catch (error) {
      console.error('Failed to refresh holiday bookings', error)
    } finally {
      setBookingsRefreshing(false)
    }
  }, [isProject, property?.crmStatus, property?.statusBadgeLabel, slug])
  const holidayArrival = searchParams.get('periodFrom')?.trim() ?? ''
  const holidayDeparture = searchParams.get('periodTo')?.trim() ?? ''
  const guestsParam = searchParams.get('guests')?.trim() ?? ''
  const guestsCustomParam = searchParams.get('guestsCustom')?.trim() ?? ''
  const holidayGuests =
    guestsParam === 'other' && guestsCustomParam
      ? guestsCustomParam
      : guestsParam || '2'
  const forQuery = searchParams.get('for')?.trim() ?? ''
  const hasHolidaySearchParams = Boolean(
    holidayArrival ||
      holidayDeparture ||
      (holidayGuests && holidayGuests !== '2'),
  )

  useEffect(() => {
    if (!slug) {
      setNotFoundState(true)
      setLoading(false)
      return
    }

    const reference = extractReferenceFromSlug(slug)
    if (!reference) {
      setNotFoundState(true)
      setLoading(false)
      return
    }

    const listingContext =
      parsePropertyDetailForQuery(forQuery) ?? takePropertyDetailListingContext(reference)

    const controller = new AbortController()
    const loadSeq = ++loadSeqRef.current

    const load = async () => {
      setLoading(true)
      setNotFoundState(false)

      try {
        let raw: Record<string, unknown> | null = null

        if (isProject) {
          raw = await fetchCRMProjectDetail(reference, {
            locale: activeLocale,
            init: { signal: controller.signal },
          })
          if (controller.signal.aborted || loadSeq !== loadSeqRef.current) return
        } else {
          const statuses = takePropertyDetailFetchStatus(reference)
          raw = await fetchCRMPropertyDetail(reference, {
            statuses,
            init: { signal: controller.signal },
          })
          if (controller.signal.aborted || loadSeq !== loadSeqRef.current) return

          if (!raw && !statuses?.length) {
            raw = await fetchCRMPropertyDetail(reference, {
              statuses: ['Sold'],
              init: { signal: controller.signal },
            })
            if (controller.signal.aborted || loadSeq !== loadSeqRef.current) return
          }
        }

        if (!raw) {
          if (loadSeq === loadSeqRef.current) {
            setProperty(null)
            setNotFoundState(true)
          }
          return
        }

        const resolvedListingContext =
          listingContext ??
          (isProject ? undefined : resolveDetailListingContextFromProperty(raw))

        const isHolidayDetail = isProject
          ? false
          : resolvePropertyDetailHolidayMode(resolvedListingContext, raw, {
              hasHolidaySearchParams,
            })

        // Rent/holiday detail must pass listingMode so LT/ST season pricing is used
        // instead of sale `current_price` (multi-listed CRM rows often have sale+rent).
        const detailListingMode =
          listingContextToListingMode(resolvedListingContext) ??
          (isHolidayDetail ? 'rent' : undefined)

        let normalized: ReturnType<typeof normalizeCRMProperty>
        try {
          normalized = normalizeCRMProperty(raw, activeLocale, {
            attachmentImageSize: PROPERTY_DETAIL_IMAGE_SIZE,
            projectListing: isProject,
            listingMode: detailListingMode,
            holidayListing: isHolidayDetail,
            holidayPeriodFrom: holidayArrival,
            holidayPeriodTo: holidayDeparture,
            holidayGuests,
            holidayPriceVariant: 'detail',
          })
        } catch (normalizeError) {
          console.error('normalizeCRMProperty failed; retrying without listingMode', normalizeError)
          normalized = normalizeCRMProperty(raw, activeLocale, {
            attachmentImageSize: PROPERTY_DETAIL_IMAGE_SIZE,
            projectListing: isProject,
            holidayListing: isHolidayDetail,
            holidayPeriodFrom: holidayArrival,
            holidayPeriodTo: holidayDeparture,
            holidayGuests,
            holidayPriceVariant: 'detail',
          })
        }

        if (controller.signal.aborted || loadSeq !== loadSeqRef.current) return

        setProperty(normalized)
        setIsHolidayRental(isHolidayDetail)
        setRentalSeasons(isProject ? [] : parseRentalSeasons(raw))
        setMinimumStay(isProject ? DEFAULT_MINIMUM_STAY : resolvePropertyMinimumStay(raw))
        setSecurityDeposit(isProject ? undefined : resolvePropertySecurityDeposit(raw))
        setBookings(isProject ? [] : parseCRMPropertyBookings(raw))
        setInquiry(extractPropertyInquiryContext(raw, normalized, resolvedListingContext))
        setBrochureUrl(isProject ? undefined : buildPropertyBrochurePdfUrl(raw, activeLocale))
        setVideos(resolveCRMPropertyVideos(raw, activeLocale))
        setDocuments(
          resolveCRMPropertyDocuments(raw, {
            locale: activeLocale,
            context: isProject ? 'construction' : 'property',
          }),
        )
        setAmenities(normalizeCRMAmenities(raw))
        setEnergy(normalizeCRMPropertyEnergy(raw))
        setLatitude(pickNumber(raw.latitude) ?? pickNumber(raw.lat))
        setLongitude(pickNumber(raw.longitude) ?? pickNumber(raw.lng))

        document.title = formatPageTitle(normalized.title)

        setShowSimilarSoldBadge(false)
        setRelatedProperties([])
        setSimilarPropertiesLoading(false)

        if (!isProject) {
          const similarListingContext = resolveSimilarListingContext(raw, resolvedListingContext)
          setShowSimilarSoldBadge(isSimilarPropertySold(raw))
          setSimilarPropertiesLoading(true)

          void (async () => {
            try {
              const similarRaw = await fetchCRMSimilarProperties({
                property: raw,
                limit: 5,
                listingContext: similarListingContext,
                signal: controller.signal,
              })

              if (controller.signal.aborted || loadSeq !== loadSeqRef.current) return

              setRelatedProperties(
                similarRaw.map((item) =>
                  normalizeCRMListProperty(item, activeLocale, {
                    listingMode:
                      similarListingContext === 'rent' || similarListingContext === 'holiday'
                        ? 'rent'
                        : 'sale',
                    holidayListing: similarListingContext === 'holiday',
                  }),
                ),
              )
            } catch (similarError) {
              if (!isAbortError(similarError)) {
                console.error('Failed to load similar properties', similarError)
                if (!controller.signal.aborted && loadSeq === loadSeqRef.current) {
                  setRelatedProperties([])
                }
              }
            } finally {
              if (!controller.signal.aborted && loadSeq === loadSeqRef.current) {
                setSimilarPropertiesLoading(false)
              }
            }
          })()
        }
      } catch (error) {
        if (isAbortError(error)) return
        if (loadSeq !== loadSeqRef.current) return
        console.error(`Failed to load ${isProject ? 'project' : 'property'} detail`, error)
        setProperty(null)
        setNotFoundState(true)
      } finally {
        if (!controller.signal.aborted && loadSeq === loadSeqRef.current) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [
    slug,
    activeLocale,
    holidayArrival,
    holidayDeparture,
    holidayGuests,
    forQuery,
    hasHolidaySearchParams,
    isProject,
  ])

  if (loading) return <PropertyDetailSkeleton />

  if (notFoundState || !property) {
    notFound()
  }

  return (
    <PropertyDetailView
      contactForm={contactForm}
      inquiry={inquiry}
      property={property}
      amenities={amenities}
      energy={energy}
      relatedProperties={relatedProperties}
      similarPropertiesLoading={similarPropertiesLoading}
      showSimilarSoldBadge={showSimilarSoldBadge}
      brochureUrl={brochureUrl}
      videos={videos}
      documents={documents}
      latitude={latitude}
      longitude={longitude}
      isHolidayRental={isHolidayRental}
      rentalSeasons={rentalSeasons}
      bookings={bookings}
      bookingsRefreshing={bookingsRefreshing}
      onRefreshBookings={refreshBookings}
      minimumStay={minimumStay}
      securityDeposit={securityDeposit}
      holidayArrival={holidayArrival}
      holidayDeparture={holidayDeparture}
      holidayGuests={holidayGuests}
    />
  )
}
