'use client'

import React, { useMemo } from 'react'

import { PropertiesCarousel, type PropertiesCarouselItem } from '@/components/PropertiesCarousel'
import type { NormalizedListProperty } from '@/utilities/crmProperties'
import { withRentalPriceFromPrefix } from '@/utilities/localizePropertyPrice'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  properties: NormalizedListProperty[]
  loading?: boolean
  showSoldBadge?: boolean
  /** Holiday similar cards: "From" before the price. */
  prefixPriceFrom?: boolean
}

export const PropertyDetailRelated: React.FC<Props> = ({
  properties,
  loading = false,
  showSoldBadge = false,
  prefixPriceFrom = false,
}) => {
  const subtitle = useTranslation('propertyDetail.similar.subtitle', 'Curated Collection')
  const title = useTranslation('propertyDetail.similar.heading', 'Similar Properties')

  const carouselProperties = useMemo<PropertiesCarouselItem[]>(
    () =>
      properties.map((property) => ({
        id: property.id,
        imageUrl: property.imageUrl,
        imageUrls: property.imageUrls,
        statusBadgeLabel: property.statusBadgeLabel,
        crmStatus: property.crmStatus,
        location: property.location,
        reference: property.reference,
        displayReference: property.displayReference,
        detailHref: property.detailHref,
        title: property.title,
        beds: property.beds,
        baths: property.baths,
        sqft: property.sqft,
        price: prefixPriceFrom ? withRentalPriceFromPrefix(property.price) : property.price,
      })),
    [prefixPriceFrom, properties],
  )

  if (!loading && carouselProperties.length === 0) return null

  return (
    <PropertiesCarousel
      subtitle={subtitle}
      title={title}
      properties={carouselProperties}
      loading={loading}
      backgroundColor="surface"
      showSoldBadge={showSoldBadge}
      useCrmStatus
      animateEntry
    />
  )
}
