'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'

import { DocumentDownloadProvider } from '@/components/DocumentDownload/DocumentDownloadProvider'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { DetailDescription } from '@/components/DetailDescription'
import { DetailReference } from '@/components/DetailReference'
import { DetailSummaryPanel } from '@/components/DetailSummaryPanel'
import {
  PropertyDetailFavoriteButton,
  PropertyDetailFooterActions,
} from '@/components/PropertyDetail/PropertyDetailActions'
import { PropertyDetailAmenities } from '@/components/PropertyDetail/PropertyDetailAmenities'
import { PropertyDetailEnergy } from '@/components/PropertyDetail/PropertyDetailEnergy'
import { PropertyDetailGallery } from '@/components/PropertyDetail/PropertyDetailGallery'
import { PropertyDetailInquiryForm } from '@/components/PropertyDetail/PropertyDetailInquiryForm'
import { PropertyHolidayBooking } from '@/components/PropertyDetail/PropertyHolidayBooking'
import { PropertyHolidayAvailabilityPanel } from '@/components/PropertyDetail/PropertyHolidayAvailabilityPanel'
import { PropertyDetailMap } from '@/components/PropertyDetail/PropertyDetailMap'
import { PropertyDetailRelated } from '@/components/PropertyDetail/PropertyDetailRelated'
import { PropertyDetailSpecs } from '@/components/PropertyDetail/PropertyDetailSpecs'
import { PropertyDetailVideo } from '@/components/PropertyDetail/PropertyDetailVideo'
import { PropertyDetailDocuments } from '@/components/PropertyDetail/PropertyDetailDocuments'
import type { CRMAmenity, CRMPropertyEnergy } from '@/utilities/crmAmenities'
import type { CRMPropertyDocumentGroup } from '@/utilities/crmPropertyDocuments'
import type { CRMPropertyVideoItem } from '@/utilities/crmPropertyVideo'
import type { Form } from '@/payload-types'
import {
  type NormalizedCRMProperty,
  type NormalizedListProperty,
} from '@/utilities/crmProperties'
import type { PropertyInquiryContext } from '@/utilities/propertyInquiry'
import type { CRMPropertyBooking, RentalSeason } from '@/utilities/holidayRentalPricing'
import { DEFAULT_MINIMUM_STAY } from '@/utilities/holidayRentalPricing'
import {
  parseHolidayGuestCount,
  resolveMaxHolidayGuests,
  clampHolidayGuestCount,
} from '@/utilities/crmHoliday'
import { withRentalPriceFromPrefix } from '@/utilities/localizePropertyPrice'
import { useLocalizedPropertyPrice, useTranslation } from '@/utilities/translateClient'
import { formatTitle } from '@/utilities/formateTitle'

type Props = {
  contactForm?: Form | null
  inquiry: PropertyInquiryContext
  property: NormalizedCRMProperty
  amenities: CRMAmenity[]
  energy: CRMPropertyEnergy | null
  relatedProperties: NormalizedListProperty[]
  similarPropertiesLoading?: boolean
  showSimilarSoldBadge?: boolean
  brochureUrl?: string
  videos?: CRMPropertyVideoItem[]
  documents?: CRMPropertyDocumentGroup[]
  latitude?: number
  longitude?: number
  portfolioHref?: string
  isHolidayRental?: boolean
  rentalSeasons?: RentalSeason[]
  bookings?: CRMPropertyBooking[]
  bookingsRefreshing?: boolean
  onRefreshBookings?: () => Promise<void>
  /** CRM `minimum_stay.saty_number` — defaults to 1 when absent. */
  minimumStay?: number
  /** CRM `security_deposit` from view-by-ref. */
  securityDeposit?: number
  holidayArrival?: string
  holidayDeparture?: string
  holidayGuests?: string
}

export const PropertyDetailView: React.FC<Props> = ({
  contactForm,
  inquiry,
  property,
  amenities,
  energy,
  relatedProperties,
  similarPropertiesLoading = false,
  showSimilarSoldBadge = false,
  brochureUrl,
  videos = [],
  documents = [],
  latitude,
  longitude,
  portfolioHref,
  isHolidayRental = false,
  rentalSeasons = [],
  bookings = [],
  bookingsRefreshing = false,
  onRefreshBookings,
  minimumStay = DEFAULT_MINIMUM_STAY,
  securityDeposit,
  holidayArrival = '',
  holidayDeparture = '',
  holidayGuests = '2',
}) => {
  const locationSubtitle = [property.city, property.region].filter(Boolean).join(', ')
  const bedroomSingular = useTranslation('propertyDetail.specs.bedroomSingular', 'Bedroom')
  const bedroomPlural = useTranslation('propertyDetail.specs.bedroomPlural', 'Bedrooms')
  const bathSingular = useTranslation('propertyDetail.specs.bathSingular', 'Bath')
  const bathPlural = useTranslation('propertyDetail.specs.bathPlural', 'Baths')
  const refPrefixLabel = useTranslation('propertyDetail.map.refPrefix', 'Ref:')
  const livingAreaLabel = useTranslation('propertyDetail.specs.livingArea', 'Living Area')
  const bedroomsLabel = useTranslation('propertyDetail.specs.bedrooms', 'Bedrooms')
  const bathroomsLabel = useTranslation('propertyDetail.specs.bathrooms', 'Bathrooms')
  const propertyTypeLabel = useTranslation('propertyDetail.specs.propertyType', 'Property Type')
  const homeLabel = useTranslation('homeLabel', 'Home')
  const propertiesLabel = useTranslation('propertiesLabel', 'Properties')
  const soldBadgeLabel = useTranslation('propertyList.card.sold', 'Sold')
  const reservedBadgeLabel = useTranslation('propertyList.card.reserved', 'Reserved')
  const listHref = portfolioHref || '/'
  const selectDatesLabel = useTranslation(
    'propertyDetail.holiday.selectDatesForPrice',
    'Select dates to view price',
  )
  const prefixPriceFrom = isHolidayRental
  const displayPrice = useLocalizedPropertyPrice(
    prefixPriceFrom ? withRentalPriceFromPrefix(property.price) : property.price,
  )
  const statusBadgeDisplay =
    property.statusBadgeLabel === 'SOLD'
      ? soldBadgeLabel
      : property.statusBadgeLabel === 'RESERVED'
        ? reservedBadgeLabel
        : undefined

  const [liveArrival, setLiveArrival] = useState(holidayArrival)
  const [liveDeparture, setLiveDeparture] = useState(holidayDeparture)
  const [liveGuests, setLiveGuests] = useState(holidayGuests)

  const maxGuests = resolveMaxHolidayGuests(property.sleeps)

  useEffect(() => {
    const next = String(
      clampHolidayGuestCount(parseHolidayGuestCount(liveGuests), maxGuests),
    )
    if (next !== liveGuests) setLiveGuests(next)
  }, [liveGuests, maxGuests])

  const specItems = [
    property.sqft
      ? { icon: 'straighten', label: livingAreaLabel, value: String(property.sqft) }
      : null,
    property.beds != null
      ? {
          icon: 'bed',
          label: bedroomsLabel,
          value: `${property.beds} ${property.beds === 1 ? bedroomSingular : bedroomPlural}`,
        }
      : null,
    property.baths != null
      ? {
          icon: 'bathtub',
          label: bathroomsLabel,
          value: `${property.baths} ${property.baths === 1 ? bathSingular : bathPlural}`,
        }
      : null,
    property.propertyType
      ? { icon: 'villa', label: propertyTypeLabel, value: property.propertyType }
      : null,
  ].filter((item): item is { icon: string; label: string; value: string } => Boolean(item))

  return (
    <DocumentDownloadProvider
      contactForm={contactForm}
      heroImageUrl={property.imageUrl}
      inquiry={inquiry}
    >
    <main className="relative overflow-hidden bg-surface-cream pt-20 text-on-surface md:pt-24 lg:pt-28">
      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="pointer-events-none -left-[22%] top-[18%] h-[36%] w-[42%] opacity-40 max-lg:hidden"
      />

      <section className="relative mx-auto mb-12 grid max-w-max-width grid-cols-1 items-start gap-8 px-margin-mobile md:mb-16 md:px-margin-desktop lg:grid-cols-12 lg:gap-x-10 xl:gap-x-14">
        <div className="lg:col-span-7 xl:col-span-8">
          <PropertyDetailGallery
            images={property.imageUrls ?? (property.imageUrl ? [property.imageUrl] : [])}
            title={property.title}
            badgeLabel={statusBadgeDisplay}
          />
        </div>

        <DetailSummaryPanel>
          <nav className="mb-6 flex flex-wrap gap-x-1.5 font-label-nav text-[10px] uppercase tracking-[0.16em] text-on-surface-variant/80">
            <Link className="transition-colors hover:text-secondary" href="/">
              {homeLabel}
            </Link>
            <span aria-hidden>/</span>
            <Link className="transition-colors hover:text-secondary" href={listHref}>
              {propertiesLabel}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-on-surface/70">{property.location}</span>
          </nav>

          <div className="mb-3 flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 font-headline-lg text-[clamp(1.75rem,2.4vw,2.35rem)] font-light leading-[1.12] tracking-[0.01em] text-primary">
              {property.title
                ? formatTitle(property.title)
                : ''}
            </h1>
            <PropertyDetailFavoriteButton propertyId={property.id} size="compact" />
          </div>

          {locationSubtitle ? (
            <p className="mb-4 flex items-center gap-1.5 font-body-md text-[14px] italic text-on-surface-variant">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
              <span>{locationSubtitle}</span>
            </p>
          ) : null}

          <DetailReference
            prefix={refPrefixLabel}
            reference={property.displayReference || property.reference || ''}
            className="mb-6"
          />

          {isHolidayRental ? (
            <div className="mb-5">
              {property.price ? (
                <p className="m-0 font-headline-md text-[clamp(1.65rem,2.2vw,2rem)] font-light leading-none text-secondary">
                  {displayPrice}
                </p>
              ) : (
                <p className="m-0 font-headline-md text-[1.25rem] italic text-on-surface-variant">
                  {selectDatesLabel}
                </p>
              )}
            </div>
          ) : property.price ? (
            <p className="mb-5 m-0 font-headline-md text-[clamp(1.65rem,2.2vw,2rem)] font-light leading-none text-secondary">
              {displayPrice}
            </p>
          ) : null}

          {(property.beds != null ||
            property.baths != null ||
            property.sqft ||
            property.propertyType) && (
            <ul className="mb-1 flex flex-wrap gap-2">
              {property.beds != null ? (
                <li className="rounded-md border border-secondary/20 bg-secondary/8 px-2.5 py-1.5 font-label-nav text-[10px] uppercase tracking-[0.12em] text-primary">
                  {property.beds} {property.beds === 1 ? bedroomSingular : bedroomPlural}
                </li>
              ) : null}
              {property.baths != null ? (
                <li className="rounded-md border border-secondary/20 bg-secondary/8 px-2.5 py-1.5 font-label-nav text-[10px] uppercase tracking-[0.12em] text-primary">
                  {property.baths} {property.baths === 1 ? bathSingular : bathPlural}
                </li>
              ) : null}
              {property.sqft ? (
                <li className="rounded-md border border-secondary/20 bg-secondary/8 px-2.5 py-1.5 font-label-nav text-[10px] uppercase tracking-[0.12em] text-primary">
                  {property.sqft}
                </li>
              ) : null}
              {property.propertyType ? (
                <li className="rounded-md border border-secondary/20 bg-secondary/8 px-2.5 py-1.5 font-label-nav text-[10px] uppercase tracking-[0.12em] text-primary">
                  {property.propertyType}
                </li>
              ) : null}
            </ul>
          )}

          <PropertyDetailFooterActions brochureUrl={brochureUrl} showBookStay={isHolidayRental} />
        </DetailSummaryPanel>
      </section>

      <DetailDescription description={property.description} />

      <PropertyDetailSpecs items={specItems} />

      <section className="relative mx-auto mb-16 max-w-max-width px-margin-mobile md:mb-24 md:px-margin-desktop">
        <div className="grid grid-cols-1 gap-12 md:gap-16 lg:grid-cols-3 lg:gap-16 xl:gap-20">
        <div className="lg:col-span-2">
          <PropertyDetailAmenities amenities={amenities} />
          <PropertyDetailEnergy energy={energy ?? { isEmpty: true }} />
          <PropertyDetailDocuments groups={documents} />
          {isHolidayRental && (
            <PropertyHolidayAvailabilityPanel
              bookings={bookings}
              arrival={liveArrival}
              departure={liveDeparture}
              refreshing={bookingsRefreshing}
            />
          )}
        </div>

        <div className="lg:col-span-1" id="property-inquiry">
          {isHolidayRental && property.reference ? (
            <PropertyHolidayBooking
              propertyReference={property.reference}
              displayReference={property.displayReference || property.reference}
              propertyTitle={property.title}
              rentalSeasons={rentalSeasons}
              bookings={bookings}
              sleeps={property.sleeps}
              minimumStay={minimumStay}
              securityDeposit={securityDeposit}
              arrival={liveArrival}
              departure={liveDeparture}
              guests={liveGuests}
              onArrivalChange={setLiveArrival}
              onDepartureChange={setLiveDeparture}
              onGuestsChange={setLiveGuests}
              onRefreshBookings={onRefreshBookings}
            />
          ) : (
            <PropertyDetailInquiryForm
              contactForm={contactForm}
              inquiry={inquiry}
              propertyTitle={property.title}
            />
          )}
        </div>
        </div>
      </section>

      {/* video section */}
      {videos.length > 0 && <PropertyDetailVideo videos={videos} propertyTitle={property.title} />}

      {latitude != null && longitude != null && (
        <PropertyDetailMap
          latitude={latitude}
          longitude={longitude}
          title={property.title}
          locationLabel={locationSubtitle || property.location}
          description={
            property.displayReference || property.reference
              ? `${refPrefixLabel} ${property.displayReference || property.reference}`
              : undefined
          }
        />
      )}

      <PropertyDetailRelated
        properties={relatedProperties}
        loading={similarPropertiesLoading}
        showSoldBadge={showSimilarSoldBadge}
        prefixPriceFrom={prefixPriceFrom}
      />
    </main>
    </DocumentDownloadProvider>
  )
}
