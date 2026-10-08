'use client'

import React from 'react'
import type { Page } from '@/payload-types'

import {
  PropertiesCarousel,
  type PropertiesCarouselItem,
} from '@/components/PropertiesCarousel'
import { PRICE_ON_REQUEST_LABEL } from '@/utilities/localizePropertyPrice'

type Props = Extract<Page['layout'][0], { blockType: 'propertiesBlock' }> & {
  crmProperties?: PropertiesCarouselItem[]
}

export const PropertiesBlockClient: React.FC<Props> = ({
  subtitle,
  title,
  backgroundColor,
  showSoldBadge,
  properties,
  dataSource,
  crmProperties = [],
}) => {
  const source = dataSource ?? 'cms'

  const normalizedCMSProperties: PropertiesCarouselItem[] =
    properties?.map((property) => ({
      imageResource:
        typeof property.image === 'object' && property.image !== null ? property.image : undefined,
      location: property.location || 'Greece',
      reference: undefined,
      title: property.title || 'Property',
      beds: property.beds ?? undefined,
      baths: property.baths ?? undefined,
      sqft: property.sqft ?? undefined,
      price: property.price || PRICE_ON_REQUEST_LABEL,
    })) ?? []

  const displayProperties = source === 'crm' ? crmProperties : normalizedCMSProperties

  return (
    <PropertiesCarousel
      subtitle={subtitle}
      title={title ?? 'Properties'}
      properties={displayProperties}
      backgroundColor={backgroundColor ?? 'surface'}
      showSoldBadge={Boolean(showSoldBadge)}
      useCrmStatus={source === 'crm'}
    />
  )
}
