'use client'

import React, { useMemo } from 'react'

import type { Page } from '@/payload-types'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { GoldCornerTicks } from '@/components/GoldCornerTicks'
import { LocalizedGoogleMapIframe } from '@/components/LocalizedGoogleMapIframe/LocalizedGoogleMapIframe'
import RichText from '@/components/RichText'
import { useDeferredSiteLocale } from '@/utilities/useDeferredSiteLocale'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'

type Props = Extract<Page['layout'][0], { blockType: 'areaDetailBlock' }>

const bodyClassName =
  'area-detail-body max-w-none font-body-md text-[15px] font-light leading-[1.9] text-on-surface/75 md:text-[16px] md:leading-[1.95] [&_a]:text-secondary [&_a]:underline-offset-4 hover:[&_a]:text-primary [&_p]:mb-5 [&_p:last-child]:mb-0 [&_strong]:font-medium [&_strong]:text-primary'

function buildEmbedUrl(lat: number, lng: number, zoom: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`
}

export const AreaDetailBlock: React.FC<Props> = ({
  title,
  subtitle,
  body,
  closing,
  mapLat,
  mapLng,
  mapZoom,
  aboutHeading,
  aboutStats,
  distancesHeading,
  distances,
}) => {
  const ref = useReveal()
  const deferredLocale = useDeferredSiteLocale()
  const discoveryLabel = useTranslation('areaDetail.discoveryLabel', 'Discover')
  const mapFallbackTitle = useTranslation('areaDetail.mapTitle', 'Area map')

  const aboutItems = useMemo(
    () => (aboutStats || []).filter((item) => item?.label?.trim() && item?.value?.trim()),
    [aboutStats],
  )
  const distanceItems = useMemo(
    () => (distances || []).filter((item) => item?.label?.trim() && item?.value?.trim()),
    [distances],
  )

  const lat = typeof mapLat === 'number' && Number.isFinite(mapLat) ? mapLat : null
  const lng = typeof mapLng === 'number' && Number.isFinite(mapLng) ? mapLng : null
  const zoom =
    typeof mapZoom === 'number' && Number.isFinite(mapZoom) && mapZoom > 0 ? mapZoom : 12
  const embedUrl = lat != null && lng != null ? buildEmbedUrl(lat, lng, zoom) : null
  const mapTitle = title?.trim() ? `${title} map` : mapFallbackTitle

  return (
    <div ref={ref}>
      <header className="relative overflow-hidden bg-surface-cream pb-12 pt-28 md:pb-16 md:pt-36 lg:pb-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 65% 50% at 10% 20%, color-mix(in srgb, var(--color-secondary) 28%, transparent), transparent 55%), radial-gradient(ellipse 45% 40% at 90% 75%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 50%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
          aria-hidden
        >
          <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/55 to-transparent" />
        </div>
        <DecorativeVectors
          variant="swirl"
          tone="whisper"
          className="pointer-events-none -left-[18%] top-[2%] h-[78%] w-[50%] max-lg:hidden"
        />
        <DecorativeVectors
          variant="rings"
          className="pointer-events-none -right-20 top-14 h-80 w-80 opacity-45 md:-right-10 md:top-20 md:h-[26rem] md:w-[26rem]"
        />

        <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
          <div className="reveal max-w-3xl">
            <p className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.32em] text-secondary sm:text-[12px]">
              {discoveryLabel}
            </p>

            {title ? (
              <h1 className="m-0 font-display-lg text-[clamp(2.6rem,5.2vw,4rem)] font-light leading-[1.02] tracking-[0.01em] text-primary">
                {title}
              </h1>
            ) : null}

            {subtitle ? (
              <p className="mt-5 m-0 font-headline-sm text-[clamp(1.15rem,2.2vw,1.55rem)] font-light italic leading-[1.45] tracking-[0.01em] text-secondary md:mt-6">
                {subtitle}
              </p>
            ) : null}

            <div className="mt-6 flex items-center gap-4 md:mt-8" aria-hidden>
              <span className="h-px w-16 bg-secondary" />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              <span className="h-px w-10 bg-secondary/40" />
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-surface-sand pb-10 pt-6 md:pb-14 md:pt-10">
        <DecorativeVectors
          variant="grid"
          tone="whisper"
          className="pointer-events-none -left-4 top-16 h-64 w-44 max-lg:hidden"
        />

        <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
          <div className="reveal relative">
            <div
              className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-[1.55rem] border border-secondary/25 md:-inset-x-3 md:-inset-y-3 md:rounded-[1.75rem]"
              aria-hidden
            />
            <article className="relative overflow-hidden rounded-[1.35rem] border border-secondary/20 bg-surface-cream px-5 py-9 shadow-[0_24px_52px_-28px_rgba(0,0,0,0.16)] sm:px-8 sm:py-11 md:rounded-[1.55rem] md:px-12 md:py-14">
              <GoldCornerTicks sizeClassName="h-7 w-7 md:h-9 md:w-9" />
              <div className="relative max-w-3xl">
                {body ? (
                  <RichText
                    data={body}
                    enableGutter={false}
                    enableProse={false}
                    className={bodyClassName}
                  />
                ) : null}
                {closing ? (
                  <p className="mt-8 m-0 border-t border-secondary/20 pt-7 font-headline-sm text-[clamp(1.1rem,1.8vw,1.35rem)] font-light italic leading-snug tracking-[0.01em] text-primary">
                    {closing}
                  </p>
                ) : null}
              </div>
            </article>
          </div>
        </div>
      </section>

      {(embedUrl || aboutItems.length > 0 || distanceItems.length > 0) && (
        <section className="relative overflow-hidden bg-surface-sand pb-16 pt-2 md:pb-24 md:pt-4 lg:pb-28">
          <DecorativeVectors
            variant="rings"
            className="pointer-events-none -right-16 bottom-10 h-72 w-72 opacity-30 md:h-80 md:w-80"
          />

          <div className="relative mx-auto grid max-w-max-width grid-cols-1 gap-8 px-margin-mobile lg:grid-cols-12 lg:gap-10 md:px-margin-desktop">
            {embedUrl ? (
              <div className="reveal lg:col-span-7">
                <div className="relative overflow-hidden rounded-[1.25rem] border border-secondary/25 bg-surface-cream shadow-[0_24px_52px_-28px_rgba(0,0,0,0.28)] md:rounded-[1.45rem]">
                  <GoldCornerTicks sizeClassName="h-7 w-7 md:h-9 md:w-9" />
                  <div className="relative aspect-[4/3] w-full md:aspect-[16/11]">
                    {deferredLocale ? (
                      <LocalizedGoogleMapIframe
                        mapUrl={embedUrl}
                        locale={deferredLocale}
                        title={mapTitle}
                        height={null}
                        className="absolute inset-0 h-full w-full border-0"
                      />
                    ) : (
                      <div className="absolute inset-0 animate-pulse bg-surface-sand" />
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {(aboutItems.length > 0 || distanceItems.length > 0) && (
              <div className={`reveal delay-100 ${embedUrl ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
                <aside className="h-full rounded-[1.25rem] border border-secondary/30 bg-surface-cream px-6 py-7 shadow-[0_22px_48px_-30px_rgba(0,0,0,0.22)] md:rounded-[1.45rem] md:px-7 md:py-8">
                  {aboutHeading || aboutItems.length > 0 ? (
                    <div>
                      {aboutHeading ? (
                        <h2 className="m-0 font-headline-sm text-[clamp(1.15rem,1.8vw,1.35rem)] font-light tracking-[0.01em] text-primary">
                          {aboutHeading}
                        </h2>
                      ) : null}
                      {aboutItems.length > 0 ? (
                        <dl className="mt-5 m-0 space-y-3">
                          {aboutItems.map((item, index) => (
                            <div
                              key={item.id || `${item.label}-${index}`}
                              className="flex items-baseline justify-between gap-4 border-b border-secondary/15 pb-3 last:border-b-0 last:pb-0"
                            >
                              <dt className="m-0 font-body-md text-[14px] font-light text-on-surface/65">
                                {item.label}
                              </dt>
                              <dd className="m-0 text-right font-label-nav text-[13px] font-semibold tracking-[0.04em] text-primary">
                                {item.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                    </div>
                  ) : null}

                  {distancesHeading || distanceItems.length > 0 ? (
                    <div className={aboutHeading || aboutItems.length > 0 ? 'mt-8' : undefined}>
                      {distancesHeading ? (
                        <h2 className="m-0 font-headline-sm text-[clamp(1.15rem,1.8vw,1.35rem)] font-light tracking-[0.01em] text-primary">
                          {distancesHeading}
                        </h2>
                      ) : null}
                      {distanceItems.length > 0 ? (
                        <dl className="mt-5 m-0 space-y-3">
                          {distanceItems.map((item, index) => (
                            <div
                              key={item.id || `${item.label}-${index}`}
                              className="flex items-baseline justify-between gap-4 border-b border-secondary/15 pb-3 last:border-b-0 last:pb-0"
                            >
                              <dt className="m-0 font-body-md text-[14px] font-light text-on-surface/65">
                                {item.label}
                              </dt>
                              <dd className="m-0 text-right font-label-nav text-[13px] font-semibold tracking-[0.04em] text-secondary">
                                {item.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                    </div>
                  ) : null}
                </aside>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
