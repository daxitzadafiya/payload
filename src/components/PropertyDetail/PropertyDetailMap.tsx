'use client'
import React from 'react'
import { LocalizedGoogleMapIframe } from '@/components/LocalizedGoogleMapIframe/LocalizedGoogleMapIframe'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { GoldCornerTicks } from '@/components/GoldCornerTicks'
import { PropertyDetailIcon } from '@/components/PropertyDetail/PropertyDetailIcon'
import { toGoogleHl } from '@/utilities/googleLocale'
import { useTranslation } from '@/utilities/translateClient'
import { useDeferredSiteLocale } from '@/utilities/useDeferredSiteLocale'

type Props = {
  latitude: number
  longitude: number
  title: string
  locationLabel: string
  description?: string
}

export const PropertyDetailMap: React.FC<Props> = ({
  latitude,
  longitude,
  title,
  locationLabel,
  description,
}) => {
  const deferredLocale = useDeferredSiteLocale()
  const heading = useTranslation('propertyDetail.map.heading', 'Prime Location')
  const openInMapsLabel = useTranslation('propertyDetail.map.openInMaps', 'Open in Maps')
  const mapTitlePrefix = useTranslation('propertyDetail.map.mapTitlePrefix', 'Map for')
  const googleHl = deferredLocale ? toGoogleHl(deferredLocale) : 'en'
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&hl=${googleHl}`
  const embedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=14&output=embed&hl=${googleHl}&language=${googleHl}`

  return (
    <section className="relative overflow-hidden bg-surface-sand py-16 md:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
      </div>
      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="-left-[16%] bottom-[8%] h-[55%] w-[40%] max-lg:hidden"
      />

      <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="mb-8 md:mb-10">
          <div className="mb-4 h-px w-16 bg-secondary" aria-hidden />
          <h2 className="m-0 font-headline-lg text-[clamp(1.65rem,2.5vw,2.25rem)] font-light tracking-[0.01em] text-primary">
            {heading}
          </h2>
        </div>

        <div className="relative overflow-hidden rounded-[1.75rem] bg-surface-cream shadow-[0_28px_60px_-32px_rgba(0,0,0,0.35)] md:rounded-[2rem]">
          <div className="relative h-[420px] w-full sm:h-[480px] md:h-[520px]">
            {deferredLocale ? (
              <LocalizedGoogleMapIframe
                key={deferredLocale}
                className="h-full w-full border-0"
                height={520}
                locale={deferredLocale}
                mapUrl={embedUrl}
                title={`${mapTitlePrefix} ${title}`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-sand" />
            )}
            <GoldCornerTicks />
          </div>

          <div className="relative z-10 mx-4 -mt-14 bg-surface-cream px-5 py-5 sm:mx-8 sm:-mt-16 sm:px-7 sm:py-6 md:mx-12 md:flex md:items-end md:justify-between md:gap-8 lg:mx-16 lg:px-9 lg:py-7">
            <div className="max-w-md">
              <span className="mb-3 block h-px w-10 bg-secondary" aria-hidden />
              <h3 className="m-0 font-headline-md text-[clamp(1.15rem,2vw,1.45rem)] font-light text-primary">
                {title}
              </h3>
              <p className="mt-2 m-0 font-label-nav text-[10px] uppercase tracking-[0.16em] text-on-surface/50">
                {locationLabel}
              </p>
              {description ? (
                <p className="mt-2 m-0 font-body-sm text-[13px] font-light text-on-surface/65">
                  {description}
                </p>
              ) : null}
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex shrink-0 items-center gap-1.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-secondary transition-colors hover:text-primary md:mt-0"
            >
              {openInMapsLabel}
              <PropertyDetailIcon name="open_in_new" className="text-current" size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
