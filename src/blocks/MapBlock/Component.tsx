'use client'

import React, { useMemo } from 'react'

import { DecorativeVectors } from '@/components/DecorativeVectors'
import { OfficeLocationsMap } from '@/components/OfficeLocationsMap/OfficeLocationsMap'
import type { Page } from '@/payload-types'
import type { ContactOfficeLocation } from '@/utilities/contactOfficeLocations'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'

type Props = Extract<Page['layout'][0], { blockType: 'mapBlock' }> & {
  officeLocations?: ContactOfficeLocation[]
}

const DEFAULT_CENTER = { lat: 48.9903224, lng: 12.1991392 }
const DEFAULT_HEIGHT = 500
const DEFAULT_ZOOM = 6

function resolveMapCenter(center?: Props['center']) {
  return {
    lat:
      typeof center?.lat === 'number' && Number.isFinite(center.lat) ? center.lat : DEFAULT_CENTER.lat,
    lng:
      typeof center?.lng === 'number' && Number.isFinite(center.lng) ? center.lng : DEFAULT_CENTER.lng,
  }
}

function resolveMapZoom(value: unknown, fallback = DEFAULT_ZOOM): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(20, n)
}

export const MapBlock: React.FC<Props> = ({
  center,
  defaultZoom,
  height,
  title,
  officeLocations = [],
}) => {
  const sectionRef = useReveal()
  const defaultTitle = useTranslation('mapBlock.title', 'Map')
  const mapTitle = useMemo(() => title || defaultTitle, [title, defaultTitle])
  const mapCenter = useMemo(() => resolveMapCenter(center), [center])
  const zoom = resolveMapZoom(defaultZoom)
  const mapHeight =
    typeof height === 'number' && Number.isFinite(height) && height > 0 ? height : DEFAULT_HEIGHT

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-surface-cream py-16 md:py-20 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
      </div>

      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="pointer-events-none -right-[18%] bottom-[10%] h-[58%] w-[42%] max-lg:hidden"
      />

      <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        {mapTitle ? (
          <div className="reveal mb-8 md:mb-10">
            <div className="mb-4 h-px w-16 bg-secondary" aria-hidden />
            <h2 className="m-0 max-w-2xl font-headline-lg text-[clamp(1.75rem,3vw,2.5rem)] font-light leading-[1.15] tracking-[0.01em] text-primary">
              {mapTitle}
            </h2>
          </div>
        ) : null}

        {/*
          Do not put the map inside `.reveal` or a parent with opacity:0.
          Google Maps initializes blank when the canvas is hidden.
        */}
        <div className="relative overflow-hidden rounded-[1.75rem] bg-surface-sand shadow-[0_28px_60px_-32px_rgba(0,0,0,0.35)] md:rounded-[2rem]">
          <OfficeLocationsMap
            center={mapCenter}
            defaultZoom={zoom}
            height={mapHeight}
            locations={officeLocations}
            title={mapTitle}
          />

          <span
            className="pointer-events-none absolute left-5 top-5 z-10 h-9 w-9 border-l-2 border-t-2 border-secondary md:left-7 md:top-7 md:h-11 md:w-11"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute right-5 top-5 z-10 h-9 w-9 border-r-2 border-t-2 border-secondary md:right-7 md:top-7 md:h-11 md:w-11"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute bottom-5 left-5 z-10 h-9 w-9 border-b-2 border-l-2 border-secondary md:bottom-7 md:left-7 md:h-11 md:w-11"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute bottom-5 right-5 z-10 h-9 w-9 border-b-2 border-r-2 border-secondary md:bottom-7 md:right-7 md:h-11 md:w-11"
            aria-hidden
          />
        </div>
      </div>
    </section>
  )
}
