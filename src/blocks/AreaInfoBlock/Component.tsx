'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

import type { Media as MediaType, Page } from '@/payload-types'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { GoldCornerTicks } from '@/components/GoldCornerTicks'
import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { PropertyListPagination } from '@/components/PropertyList/PropertyListPagination'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'
import { cn } from '@/utilities/ui'

type Props = Extract<Page['layout'][0], { blockType: 'areaInfoBlock' }>

/** Two cards per page — matches the reference 2-column layout. */
const PAGE_SIZE = 2

const ctaClassName =
  'inline-flex w-full items-center justify-center rounded-md border border-secondary bg-secondary px-6 py-3.5 text-center font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_30px_-16px_color-mix(in_srgb,var(--color-secondary)_70%,transparent)] transition-all duration-300 hover:border-primary hover:bg-primary hover:text-on-primary hover:shadow-[0_14px_34px_-14px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] active:scale-[0.98] sm:text-[12px]'

function isMedia(value: unknown): value is MediaType {
  return Boolean(value && typeof value === 'object' && 'id' in value)
}

function formatIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}

export const AreaInfoBlock: React.FC<Props> = ({ title, subtitle, intro, highlights, cards }) => {
  const ref = useReveal()
  const gridRef = useRef<HTMLDivElement>(null)
  const regionsLabel = useTranslation('areaInfo.regionsLabel', 'The coastline')
  const regionsTitle = useTranslation('areaInfo.regionsTitle', 'Costa del Sol')
  const regionsNote = useTranslation(
    'areaInfo.regionsNote',
    'From Marbella to Estepona — neighbourhoods chosen for light, lifestyle, and lasting value.',
  )
  const guideLabel = useTranslation('areaInfo.guideLabel', 'Neighbourhoods')
  const featuredLabel = useTranslation('areaInfo.featuredLabel', 'Featured areas')

  const highlightItems = useMemo(
    () => (highlights || []).filter((item) => item?.name?.trim() && item?.description?.trim()),
    [highlights],
  )
  const cardItems = useMemo(
    () => (cards || []).filter((item) => item?.title?.trim()),
    [cards],
  )

  const totalPages = Math.max(1, Math.ceil(cardItems.length / PAGE_SIZE))
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const pageCards = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return cardItems.slice(start, start + PAGE_SIZE)
  }, [cardItems, page])

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages)
    setPage(clamped)
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div ref={ref}>
      <header className="relative overflow-hidden bg-surface-cream pb-14 pt-28 md:pb-16 md:pt-36 lg:pb-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 65% 50% at 8% 18%, color-mix(in srgb, var(--color-secondary) 28%, transparent), transparent 55%), radial-gradient(ellipse 50% 45% at 92% 80%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 50%)',
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

        <div className="relative mx-auto grid max-w-max-width grid-cols-1 items-end gap-10 px-margin-mobile md:grid-cols-12 md:gap-8 md:px-margin-desktop lg:gap-12">
          <div className="reveal md:col-span-7 lg:col-span-8">
            <p className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.32em] text-secondary sm:text-[12px]">
              {regionsLabel}
            </p>

            {title ? (
              <h1 className="m-0 max-w-xl font-display-lg text-[clamp(2.6rem,5.4vw,4rem)] font-light leading-[1.02] tracking-[0.01em] text-primary">
                {title}
              </h1>
            ) : null}

            {subtitle ? (
              <p className="mt-5 m-0 max-w-xl font-headline-sm text-[clamp(1.15rem,2.1vw,1.5rem)] font-light italic leading-[1.45] tracking-[0.01em] text-secondary md:mt-6">
                {subtitle}
              </p>
            ) : null}

            <div className="mt-6 flex items-center gap-4 md:mt-8" aria-hidden>
              <span className="h-px w-16 bg-secondary" />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              <span className="h-px w-10 bg-secondary/40" />
            </div>

            {intro ? (
              <p className="mt-6 m-0 max-w-xl font-body-md text-[15px] font-light leading-[1.9] text-on-surface/68 md:mt-8 md:text-[16px] md:leading-[1.95]">
                {intro}
              </p>
            ) : null}
          </div>

          <div className="reveal delay-150 md:col-span-5 lg:col-span-4">
            <aside className="relative overflow-hidden rounded-[1.35rem] border border-secondary/30 bg-surface-sand/70 px-6 py-7 md:rounded-[1.5rem] md:px-7 md:py-8">
              <DecorativeVectors
                variant="rings"
                tone="whisper"
                className="pointer-events-none -right-10 -top-8 h-36 w-36 opacity-40"
              />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3" aria-hidden>
                  <span className="h-px w-8 bg-secondary" />
                  <span className="h-1 w-1 rotate-45 bg-secondary" />
                </div>
                <p className="m-0 font-label-nav text-[10px] uppercase tracking-[0.28em] text-secondary sm:text-[11px]">
                  {regionsLabel}
                </p>
                <p className="mt-3 m-0 font-headline-sm text-[clamp(1.05rem,1.8vw,1.3rem)] font-light leading-snug tracking-[0.01em] text-primary">
                  {regionsTitle}
                </p>
                <p className="mt-4 m-0 font-body-md text-[13px] font-light leading-[1.7] text-on-surface/65 sm:text-[14px]">
                  {regionsNote}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </header>

      {highlightItems.length > 0 ? (
        <section className="relative overflow-hidden bg-surface-sand pb-10 pt-8 md:pb-14 md:pt-12">
          <DecorativeVectors
            variant="grid"
            tone="whisper"
            className="pointer-events-none -left-4 top-20 h-64 w-44 max-lg:hidden"
          />

          <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
            <div className="reveal mb-8 md:mb-10">
              <div className="mb-3 flex items-center gap-3" aria-hidden>
                <span className="h-px w-10 bg-secondary" />
                <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              </div>
              <p className="m-0 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
                {guideLabel}
              </p>
            </div>

            <ol className="reveal delay-100 m-0 grid list-none grid-cols-1 gap-x-12 gap-y-7 p-0 md:grid-cols-2 md:gap-y-8">
              {highlightItems.map((item, index) => (
                <li
                  key={item.id || `${item.name}-${index}`}
                  className="flex gap-4 border-t border-secondary/20 pt-5 md:gap-5"
                >
                  <span className="mt-0.5 font-label-nav text-[11px] tracking-[0.14em] text-secondary">
                    {formatIndex(index)}
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 font-headline-sm text-[1.05rem] font-light leading-snug tracking-[0.01em] text-primary md:text-[1.15rem]">
                      {item.name}
                    </p>
                    <p className="mt-2 m-0 font-body-md text-[14.5px] font-light leading-[1.75] text-on-surface/68 md:text-[15px]">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {cardItems.length > 0 ? (
        <section className="relative overflow-hidden bg-surface-sand pb-16 pt-4 md:pb-24 md:pt-6 lg:pb-28">
          <DecorativeVectors
            variant="rings"
            className="pointer-events-none -right-20 bottom-8 h-72 w-72 opacity-30 md:h-80 md:w-80"
          />

          <div
            ref={gridRef}
            className="relative mx-auto max-w-max-width scroll-mt-28 px-margin-mobile md:scroll-mt-32 md:px-margin-desktop"
          >
            <div className="reveal mb-8 md:mb-10">
              <div className="mb-3 flex items-center gap-3" aria-hidden>
                <span className="h-px w-10 bg-secondary" />
                <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              </div>
              <p className="m-0 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
                {featuredLabel}
              </p>
            </div>

            <ul
              key={page}
              className="m-0 grid list-none grid-cols-1 gap-8 p-0 lg:grid-cols-2 lg:gap-10"
            >
              {pageCards.map((card, index) => {
                const image = isMedia(card.image) ? card.image : null
                const description = card.description?.trim()
                const ctaLabel = card.ctaLabel?.trim()
                const showCta = Boolean(ctaLabel && card.ctaLink)

                return (
                  <li
                    key={card.id || `${card.title}-${page}-${index}`}
                    className="reveal group"
                    style={{ animationDelay: `${Math.min(index * 90, 240)}ms` }}
                  >
                    <article
                      className={cn(
                        'flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-secondary/20 bg-surface-cream',
                        'shadow-[0_22px_48px_-30px_rgba(0,0,0,0.26)]',
                        'transition-all duration-500 ease-out',
                        'hover:-translate-y-1 hover:border-secondary/45 hover:shadow-[0_28px_56px_-26px_rgba(0,0,0,0.32)]',
                        'md:rounded-[1.45rem]',
                      )}
                    >
                      <span
                        className="h-[3px] w-full bg-gradient-to-r from-secondary via-secondary to-primary/50"
                        aria-hidden
                      />

                      <div className="relative mx-5 mt-5 overflow-hidden rounded-[1rem] border border-secondary/15 md:mx-6 md:mt-6 md:rounded-[1.15rem]">
                        <div className="relative aspect-[16/10] w-full">
                          <GoldCornerTicks sizeClassName="h-6 w-6 md:h-8 md:w-8" />
                          {image ? (
                            <Media
                              resource={image}
                              fill
                              imgClassName="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-surface-sand to-primary/20" />
                          )}
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col px-5 pb-6 pt-5 md:px-6 md:pb-7 md:pt-6">
                        {card.title ? (
                          <h2 className="m-0 font-headline-md text-[clamp(1.55rem,2.4vw,2.05rem)] font-light leading-snug tracking-[0.01em] text-primary">
                            {card.title}
                          </h2>
                        ) : null}

                        {description ? (
                          <p className="mt-3 m-0 font-body-md text-[14px] font-light leading-[1.7] text-on-surface/65 md:text-[15px]">
                            {description}
                          </p>
                        ) : null}

                        {showCta && card.ctaLink ? (
                          <div className="mt-6">
                            <CMSLink
                              {...card.ctaLink}
                              label={ctaLabel}
                              appearance="inline"
                              className={ctaClassName}
                            />
                          </div>
                        ) : null}
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>

            <PropertyListPagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </section>
      ) : null}
    </div>
  )
}
