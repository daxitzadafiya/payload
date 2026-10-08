'use client'

import React, { useState } from 'react'

import { PropertyDetailIcon } from '@/components/PropertyDetail/PropertyDetailIcon'
import type { CRMAmenity } from '@/utilities/crmAmenities'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  amenities: CRMAmenity[]
}

const PREVIEW_COUNT = 8

export const PropertyDetailAmenities: React.FC<Props> = ({ amenities }) => {
  const heading = useTranslation('propertyDetail.amenities.heading', 'Exclusive Amenities')
  const readMoreLabel = useTranslation('propertyDetail.description.readMore', 'Read more')
  const readLessLabel = useTranslation('propertyDetail.description.readLess', 'Read less')
  const [expanded, setExpanded] = useState(false)

  if (amenities.length === 0) return null

  const needsClamp = amenities.length > PREVIEW_COUNT
  const visibleAmenities = !needsClamp || expanded ? amenities : amenities.slice(0, PREVIEW_COUNT)

  return (
    <div>
      <div className="mb-10 md:mb-12">
        <span className="mb-4 block h-px w-12 bg-secondary" aria-hidden />
        <h2 className="m-0 font-headline-lg text-[clamp(1.65rem,2.5vw,2.25rem)] font-light tracking-[0.01em] text-primary">
          {heading}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 md:gap-x-8 md:gap-y-10 lg:grid-cols-4">
        {visibleAmenities.map((amenity) => (
          <div key={amenity.key} className="group flex flex-col items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-secondary/30 bg-surface-sand text-secondary transition-colors duration-300 group-hover:border-secondary group-hover:bg-secondary group-hover:text-on-secondary">
              <PropertyDetailIcon name={amenity.icon} className="text-current" size={20} />
            </div>
            <h3 className="m-0 font-label-nav text-[11px] uppercase tracking-[0.14em] text-primary">
              {amenity.label}
            </h3>
          </div>
        ))}
      </div>
      {needsClamp ? (
        <button
          type="button"
          className="mt-8 cursor-pointer font-label-nav text-[11px] uppercase tracking-[0.16em] text-secondary transition-colors hover:text-primary"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? readLessLabel : readMoreLabel}
        </button>
      ) : null}
    </div>
  )
}
