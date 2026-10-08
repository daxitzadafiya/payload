'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'

import { DecorativeVectors } from '@/components/DecorativeVectors'
import { Media } from '@/components/Media'
import { useReveal } from '@/utilities/useReveal'
import type { Media as MediaType } from '@/payload-types'
import { cn } from '@/utilities/ui'

type CertificateItem = {
  title: string
  subtitle?: string | null
  image: string | MediaType
}

type Props = {
  subtitle?: string | null
  title: string
  certificates?: CertificateItem[] | null
}

function formatIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}

const navBtnClassName =
  'flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-secondary/55 text-secondary transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-on-secondary active:scale-[0.98] disabled:cursor-default disabled:opacity-35'

export const CertificatesBlock: React.FC<Props> = ({ subtitle, title, certificates }) => {
  const sectionRef = useReveal()
  const items = certificates ?? []
  const total = items.length
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, total - 1)))
  }, [total])

  const goTo = useCallback(
    (index: number) => {
      if (!total) return
      setActiveIndex(((index % total) + total) % total)
    },
    [total],
  )

  const handlePrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])
  const handleNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])

  const active = items[activeIndex]
  if (!total || !active) return null

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-surface-sand py-16 md:py-20 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/55 to-transparent" />
      </div>

      {/* Breathing rings — Founder pattern */}
      <div
        className="about-ring-breathe pointer-events-none absolute -left-20 top-8 h-80 w-80 rounded-full border border-secondary/25 md:-left-16 md:top-12 md:h-[28rem] md:w-[28rem]"
        aria-hidden
      />
      <div
        className="about-ring-breathe about-ring-breathe-delay pointer-events-none absolute -left-10 top-24 h-56 w-56 rounded-full border border-secondary/15 md:h-80 md:w-80"
        aria-hidden
      />
      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="pointer-events-none -right-[18%] bottom-[4%] h-[55%] w-[42%] max-lg:hidden"
      />
      <DecorativeVectors
        variant="grid"
        tone="whisper"
        className="pointer-events-none right-[6%] top-16 h-72 w-48 max-md:hidden"
      />

      <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        {/* Masthead */}
        <div className="reveal mb-12 max-w-3xl md:mb-16 lg:mb-20">
          {subtitle ? (
            <span className="mb-4 block font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
              {subtitle}
            </span>
          ) : null}
          <h2 className="m-0 font-display-lg text-[clamp(2.2rem,4.2vw,3.5rem)] font-light leading-[1.08] tracking-[0.01em] text-primary">
            {title}
          </h2>
          <div className="mt-6 flex items-center gap-3 md:mt-7" aria-hidden>
            <span className="h-px w-14 bg-secondary" />
            <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
            <span className="h-px w-8 bg-secondary/40" />
          </div>
        </div>

        {/* Spotlight — Founder split */}
        <div className="reveal grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-16">
          {/* Framed certificate image */}
          <div className="relative order-1 lg:order-2 lg:col-span-6 xl:col-span-7">
            <div className="relative mx-auto max-w-lg lg:ml-auto lg:mr-0 lg:max-w-none">
              <div
                className="absolute -right-3 -top-3 h-[92%] w-[92%] rounded-[2rem] border border-secondary/40 md:-right-5 md:-top-5"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-[2rem] bg-surface-cream shadow-[0_28px_60px_-28px_rgba(0,0,0,0.32)]">
                {typeof active.image === 'object' && active.image !== null ? (
                  <Media
                    key={activeIndex}
                    resource={active.image}
                    imgClassName="h-auto w-full object-contain"
                    pictureClassName="block w-full"
                  />
                ) : (
                  <div className="aspect-[4/5] w-full bg-surface-cream" />
                )}
                <span className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-md bg-surface-cream/90 px-2.5 py-1 font-label-nav text-[12px] tabular-nums tracking-[0.22em] text-secondary backdrop-blur-sm md:bottom-5 md:left-5 md:text-[13px]">
                  {formatIndex(activeIndex)}
                  <span className="mx-2 text-secondary/50">/</span>
                  {formatIndex(total - 1)}
                </span>
              </div>
            </div>
          </div>

          {/* Copy + controls */}
          <div className="order-2 flex flex-col lg:order-1 lg:col-span-6 xl:col-span-5">
            <span className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
              {formatIndex(activeIndex)}
            </span>

            <h3
              key={`title-${activeIndex}`}
              className="m-0 font-headline-lg text-[clamp(1.75rem,3vw,2.55rem)] font-light leading-[1.15] tracking-[0.01em] text-primary"
            >
              {active.title}
            </h3>

            {active.subtitle ? (
              <p
                key={`sub-${activeIndex}`}
                className="mt-5 m-0 max-w-md font-body-lg text-[15px] font-light leading-[1.85] text-on-surface/75 md:mt-6 md:text-[16px] md:leading-[1.9]"
              >
                {active.subtitle}
              </p>
            ) : null}

            {total > 1 ? (
              <div className="mt-8 flex items-center gap-3 md:mt-10">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous certificate"
                  className={navBtnClassName}
                >
                  <ChevronLeft size={20} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next certificate"
                  className={navBtnClassName}
                >
                  <ChevronRight size={20} strokeWidth={1.75} />
                </button>
              </div>
            ) : null}

            {/* Selector rail */}
            {total > 1 ? (
              <nav
                className="mt-10 flex flex-col border-t border-secondary/25 pt-6 md:mt-12"
                aria-label="Certificates"
              >
                {items.map((item, idx) => {
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => goTo(idx)}
                      className={cn(
                        'group flex w-full cursor-pointer items-start gap-4 border-l py-3.5 pl-4 text-left transition-colors duration-300',
                        isActive
                          ? 'border-secondary text-primary'
                          : 'border-transparent text-on-surface/45 hover:border-secondary/40 hover:text-primary',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 shrink-0 font-label-nav text-[10px] tabular-nums tracking-[0.12em]',
                          isActive ? 'text-secondary' : 'text-secondary/45',
                        )}
                      >
                        {formatIndex(idx)}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            'block font-label-nav text-[11px] uppercase leading-snug tracking-[0.12em] sm:text-[12px]',
                            isActive && 'text-primary',
                          )}
                        >
                          {item.title}
                        </span>
                        {item.subtitle ? (
                          <span className="mt-1 block font-body-sm text-[13px] font-light leading-snug text-on-surface/50 line-clamp-1">
                            {item.subtitle}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
