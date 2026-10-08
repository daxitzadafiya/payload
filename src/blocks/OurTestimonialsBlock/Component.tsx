'use client'

import React, { useEffect, useMemo, useState } from 'react'

import type { Page } from '@/payload-types'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { PropertyListPagination } from '@/components/PropertyList/PropertyListPagination'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'
import { cn } from '@/utilities/ui'

type Props = Extract<Page['layout'][0], { blockType: 'ourTestimonialsBlock' }>

/** 3-column × 2-row page — matches the reference layout. */
const PAGE_SIZE = 6

export const OurTestimonialsBlock: React.FC<Props> = ({ title, intro, testimonials }) => {
  const ref = useReveal()
  const gridRef = React.useRef<HTMLDivElement>(null)
  const voicesLabel = useTranslation('ourTestimonials.voicesLabel', 'Client voices')
  const items = useMemo(
    () =>
      (testimonials || []).filter((item) => item?.quote?.trim() && item?.attribution?.trim()),
    [testimonials],
  )

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return items.slice(start, start + PAGE_SIZE)
  }, [items, page])

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages)
    setPage(clamped)
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div ref={ref}>
      {/* Masthead */}
      <header className="relative overflow-hidden bg-surface-cream pb-12 pt-28 md:pb-16 md:pt-36 lg:pb-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 48% at 50% 0%, color-mix(in srgb, var(--color-secondary) 26%, transparent), transparent 58%), radial-gradient(ellipse 40% 40% at 100% 80%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 50%)',
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
          className="pointer-events-none -left-[18%] top-[4%] h-[70%] w-[48%] max-lg:hidden"
        />
        <DecorativeVectors
          variant="rings"
          className="pointer-events-none -right-20 top-16 h-72 w-72 opacity-40 md:-right-8 md:top-24 md:h-[24rem] md:w-[24rem]"
        />

        <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
          <div className="reveal mx-auto max-w-3xl text-center">
            <p className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.32em] text-secondary sm:text-[12px]">
              {voicesLabel}
            </p>

            {title ? (
              <h1 className="m-0 font-display-lg text-[clamp(2.35rem,4.8vw,3.55rem)] font-light leading-[1.08] tracking-[0.01em] text-primary">
                {title}
              </h1>
            ) : null}

            <div className="mt-6 flex items-center justify-center gap-4 md:mt-8" aria-hidden>
              <span className="h-px w-14 bg-secondary sm:w-16" />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              <span className="h-px w-14 bg-secondary sm:w-16" />
            </div>

            {intro ? (
              <p className="mx-auto mt-6 m-0 max-w-2xl font-body-md text-[15px] font-light leading-[1.9] text-on-surface/68 md:mt-8 md:text-[16.5px] md:leading-[1.95]">
                {intro}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {/* Voices grid */}
      <section className="relative overflow-hidden bg-surface-sand pb-16 pt-4 md:pb-24 md:pt-6 lg:pb-28">
        <DecorativeVectors
          variant="grid"
          tone="whisper"
          className="pointer-events-none -left-4 top-24 h-64 w-44 max-lg:hidden"
        />
        <DecorativeVectors
          variant="rings"
          className="pointer-events-none -right-20 bottom-10 h-72 w-72 opacity-30 md:h-80 md:w-80"
        />

        <div
          ref={gridRef}
          className="relative mx-auto max-w-max-width scroll-mt-28 px-margin-mobile md:scroll-mt-32 md:px-margin-desktop"
        >
          {pageItems.length > 0 ? (
            <ul
              key={page}
              className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8"
            >
              {pageItems.map((item, index) => (
                <li
                  key={item.id || `${item.attribution}-${page}-${index}`}
                  className={cn(
                    'reveal group relative flex h-full min-h-[20rem] flex-col',
                    index % 3 === 1 && 'lg:translate-y-3',
                    index % 3 === 2 && 'lg:translate-y-1.5',
                  )}
                  style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
                >
                  <article
                    className={cn(
                      'relative flex h-full flex-col overflow-hidden rounded-[1.15rem] border border-secondary/20 bg-surface-cream',
                      'shadow-[0_22px_48px_-30px_rgba(0,0,0,0.28)]',
                      'transition-all duration-500 ease-out',
                      'hover:-translate-y-1.5 hover:border-secondary/45 hover:shadow-[0_28px_56px_-26px_rgba(0,0,0,0.34)]',
                      'md:rounded-[1.35rem]',
                    )}
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-secondary via-secondary to-primary/50"
                      aria-hidden
                    />
                    <span
                      className="pointer-events-none absolute inset-x-3 top-3 h-px bg-gradient-to-r from-transparent via-secondary/35 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:inset-x-4 md:top-4"
                      aria-hidden
                    />

                    <div className="flex flex-1 flex-col px-7 pb-8 pt-10 sm:px-8 sm:pb-9 sm:pt-11">
                      <span
                        className="mx-auto mb-1 block font-display-lg text-[4rem] leading-[0.7] text-primary/25 select-none transition-colors duration-500 group-hover:text-secondary/55 sm:text-[4.5rem]"
                        aria-hidden
                      >
                        &ldquo;
                      </span>

                      <blockquote className="m-0 flex-1 text-center font-headline-sm text-[clamp(1.05rem,1.4vw,1.22rem)] font-light italic leading-[1.75] tracking-[0.01em] text-on-surface/78">
                        {item.quote}
                      </blockquote>

                      <div className="mt-8 flex items-center justify-center gap-3" aria-hidden>
                        <span className="h-px w-8 bg-outline-variant/80" />
                        <span className="h-1 w-1 rotate-45 bg-secondary/70" />
                        <span className="h-px w-8 bg-outline-variant/80" />
                      </div>

                      <p className="mt-5 m-0 text-center font-label-nav text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary sm:text-[12px] sm:tracking-[0.18em]">
                        {item.attribution}
                      </p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : null}

          <PropertyListPagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </section>
    </div>
  )
}
