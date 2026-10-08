'use client'

import React, { useCallback, useEffect, useRef } from 'react'

import type { Page } from '@/payload-types'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { GoldCornerTicks } from '@/components/GoldCornerTicks'
import RichText from '@/components/RichText'
import { useReveal } from '@/utilities/useReveal'
import { cn } from '@/utilities/ui'

type Props = Extract<Page['layout'][0], { blockType: 'buyingGuideBlock' }>
type Step = NonNullable<Props['steps']>[number]

const bodyClassName =
  'guide-body max-w-none font-body-md text-[15px] font-light leading-[1.85] text-on-surface/75 [&_a]:text-secondary [&_a]:underline-offset-2 hover:[&_a]:text-primary [&_li]:my-1.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-medium [&_strong]:text-primary/90 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5'

function formatIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}

function stepAnchorId(index: number) {
  return `buying-guide-step-${index}`
}

function getHeaderScrollOffset() {
  if (typeof window === 'undefined') return 120
  return window.matchMedia('(min-width: 640px)').matches ? 120 : 100
}

function scrollToStep(index: number) {
  const el = document.getElementById(stepAnchorId(index))
  if (!el) return
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - getHeaderScrollOffset())
  window.scrollTo({ top, behavior: 'smooth' })
}

export const BuyingGuideBlock: React.FC<Props> = ({
  eyebrow,
  title,
  lead,
  steps,
  closingHeading,
  closingBody,
}) => {
  const ref = useReveal()
  const list = steps || []
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [instantLayout, setInstantLayout] = React.useState(false)
  const [scrollTicket, setScrollTicket] = React.useState(0)
  const pendingScrollRef = useRef<number | null>(null)

  const activeStep: Step | null = list[activeIndex] ?? null
  const progress = list.length > 1 ? (activeIndex / (list.length - 1)) * 100 : 0
  const isLastStep = list.length > 0 && activeIndex === list.length - 1
  const showClosing = isLastStep && Boolean(closingHeading || closingBody)

  const selectStep = useCallback((index: number, scroll = false) => {
    setActiveIndex(index)
    if (!scroll) return
    pendingScrollRef.current = index
    setInstantLayout(true)
    setScrollTicket((n) => n + 1)
  }, [])

  useEffect(() => {
    const index = pendingScrollRef.current
    if (index === null || scrollTicket === 0) return

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToStep(index)
        pendingScrollRef.current = null
        window.setTimeout(() => setInstantLayout(false), 80)
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeIndex, scrollTicket])

  return (
    <div ref={ref}>
      {/* Masthead — cream editorial (matches Privacy / Cookie pages) */}
      <header className="relative overflow-hidden bg-surface-cream pb-14 pt-28 md:pb-16 md:pt-36 lg:pb-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
          aria-hidden
        >
          <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/55 to-transparent" />
        </div>
        <DecorativeVectors
          variant="swirl"
          tone="whisper"
          className="pointer-events-none -left-[18%] top-[4%] h-[72%] w-[48%] max-lg:hidden"
        />
        <DecorativeVectors
          variant="rings"
          className="pointer-events-none -right-20 top-16 h-72 w-72 opacity-50 md:-right-12 md:top-24 md:h-96 md:w-96"
        />

        <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
          <div className="reveal max-w-3xl">
            {eyebrow ? (
              <p className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.32em] text-secondary sm:text-[12px]">
                {eyebrow}
              </p>
            ) : null}

            {title ? (
              <h1 className="m-0 font-display-lg text-[clamp(2.1rem,4.5vw,3.5rem)] font-light leading-[1.1] tracking-[0.01em] text-primary">
                {title}
              </h1>
            ) : null}

            <div className="mt-6 flex items-center gap-4 md:mt-8" aria-hidden>
              <span className="h-px w-14 bg-secondary" />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              <span className="h-px w-8 bg-secondary/40" />
            </div>

            {lead ? (
              <p className="mt-6 m-0 max-w-2xl font-body-lg text-[15px] font-light leading-[1.85] text-on-surface/75 md:mt-8 md:text-[16px]">
                {lead}
              </p>
            ) : null}

            {list.length > 0 ? (
              <p className="mt-5 m-0 font-label-nav text-[11px] uppercase tracking-[0.22em] text-secondary">
                {list.length} steps · chapter {activeIndex + 1} of {list.length}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {/* Journey body */}
      <section
        id="buying-guide-journey"
        className="relative overflow-hidden bg-surface-sand pb-16 pt-10 md:pb-24 md:pt-12 lg:pb-28"
      >
        <DecorativeVectors
          variant="grid"
          tone="whisper"
          className="pointer-events-none -right-4 bottom-10 h-72 w-48 max-md:hidden"
        />

        <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
          {/* Progress rail */}
          {list.length > 0 ? (
            <div className="reveal mb-10 md:mb-12">
              <div className="relative mx-auto max-w-4xl">
                <div className="absolute left-4 right-4 top-[18px] h-px bg-secondary/25 sm:left-6 sm:right-6" aria-hidden />
                <div
                  className="absolute left-4 top-[18px] h-px bg-secondary transition-[width] duration-500 ease-out sm:left-6"
                  style={{ width: `calc(${progress}% - 0px)` }}
                  aria-hidden
                />
                <nav
                  className="relative flex justify-between gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  aria-label="Guide progress"
                >
                  {list.map((step, index) => {
                    const active = activeIndex === index
                    const done = index < activeIndex
                    return (
                      <button
                        key={step.id || index}
                        type="button"
                        onClick={() => selectStep(index, true)}
                        className="group flex min-w-[2.75rem] flex-1 flex-col items-center gap-2"
                        aria-current={active ? 'step' : undefined}
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full border-2 font-label-nav text-[11px] tracking-[0.08em] transition-all duration-300',
                            active
                              ? 'border-primary bg-primary text-on-primary shadow-[0_10px_24px_-12px_color-mix(in_srgb,var(--color-primary)_65%,transparent)] scale-110'
                              : done
                                ? 'border-secondary bg-secondary text-on-secondary'
                                : 'border-secondary/40 bg-surface-cream text-primary group-hover:border-secondary',
                          )}
                        >
                          {formatIndex(index)}
                        </span>
                        <span
                          className={cn(
                            'hidden max-w-[6.5rem] text-center font-label-nav text-[9px] uppercase leading-snug tracking-[0.08em] lg:line-clamp-2',
                            active ? 'text-primary' : 'text-on-surface/45',
                          )}
                        >
                          {step.title}
                        </span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          ) : null}

          <div className="reveal delay-100 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Chapter list */}
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="lg:sticky lg:top-28">
                <div className="mb-4 flex items-center gap-3" aria-hidden>
                  <span className="h-px w-6 bg-secondary/60" />
                  <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
                </div>
                <p className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary">
                  Chapters
                </p>
                <nav className="flex flex-col" aria-label="Guide chapters">
                  {list.map((step, index) => {
                    const active = activeIndex === index
                    return (
                      <button
                        key={step.id || index}
                        type="button"
                        onClick={() => selectStep(index, true)}
                        className={cn(
                          'group flex items-start gap-3 border-l py-3 pl-4 text-left transition-colors duration-300',
                          active
                            ? 'border-secondary text-primary'
                            : 'border-secondary/20 text-on-surface/50 hover:border-secondary/45 hover:text-primary',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 shrink-0 font-label-nav text-[10px] tabular-nums tracking-[0.1em]',
                            active ? 'text-secondary' : 'text-secondary/50',
                          )}
                        >
                          {formatIndex(index)}
                        </span>
                        <span className="font-label-nav text-[11px] uppercase leading-snug tracking-[0.08em] sm:text-[12px]">
                          {step.title}
                        </span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </aside>

            {/* Active chapter panel */}
            <div className="min-w-0 lg:col-span-8 xl:col-span-9">
              <div
                id={stepAnchorId(activeIndex)}
                className="relative scroll-mt-[7.5rem]"
              >
                <div
                  className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-[1.55rem] border border-secondary/25 md:-inset-x-3 md:-inset-y-3 md:rounded-[1.75rem]"
                  aria-hidden
                />
                <article
                  className={cn(
                    'relative overflow-hidden rounded-[1.35rem] border border-secondary/20 bg-surface-cream px-5 py-8 shadow-[0_24px_52px_-28px_rgba(0,0,0,0.18)] sm:px-8 sm:py-10 md:rounded-[1.55rem] md:px-10 md:py-12',
                    !instantLayout && 'transition-shadow duration-500',
                  )}
                >
                  <GoldCornerTicks sizeClassName="h-7 w-7 md:h-9 md:w-9" />
                  <DecorativeVectors
                    variant="rings"
                    tone="whisper"
                    className="pointer-events-none -right-14 -top-12 h-44 w-44 opacity-35"
                  />

                  <div className="relative mb-6 flex flex-wrap items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-secondary/40 bg-surface-sand font-label-nav text-[13px] tracking-[0.1em] text-primary">
                      {formatIndex(activeIndex)}
                    </span>
                    <span className="font-label-nav text-[11px] uppercase tracking-[0.22em] text-secondary">
                      Chapter {formatIndex(activeIndex)}
                    </span>
                  </div>

                  {activeStep?.title ? (
                    <h2 className="relative m-0 max-w-2xl font-headline-md text-[clamp(1.45rem,2.6vw,2rem)] font-light leading-snug tracking-[0.01em] text-primary">
                      {activeStep.title}
                    </h2>
                  ) : null}

                  <div className="relative mt-5 h-px w-14 bg-secondary" aria-hidden />

                  {activeStep?.body ? (
                    <div className="relative mt-6 md:mt-8">
                      <RichText
                        data={activeStep.body}
                        enableGutter={false}
                        enableProse={false}
                        className={cn(bodyClassName, 'md:max-w-2xl')}
                      />
                    </div>
                  ) : null}

                  <div className="relative mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-secondary/15 pt-6">
                    <button
                      type="button"
                      disabled={activeIndex <= 0}
                      onClick={() => selectStep(Math.max(0, activeIndex - 1), true)}
                      className="inline-flex items-center gap-2 font-label-nav text-[11px] uppercase tracking-[0.16em] text-secondary transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      disabled={activeIndex >= list.length - 1}
                      onClick={() => selectStep(Math.min(list.length - 1, activeIndex + 1), true)}
                      className="inline-flex items-center gap-2 rounded-md bg-secondary px-5 py-2.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary transition-colors hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Next chapter →
                    </button>
                  </div>
                </article>
              </div>

              {showClosing ? (
                <div className="relative mt-10 md:mt-12">
                  <div
                    className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-[1.35rem] border border-secondary/35 md:-inset-x-3 md:-inset-y-3 md:rounded-[1.6rem]"
                    aria-hidden
                  />
                  <div className="relative overflow-hidden rounded-[1.25rem] border border-secondary/15 bg-surface-sand px-6 py-9 sm:px-8 sm:py-10 md:rounded-[1.5rem] md:px-10 md:py-11">
                    <DecorativeVectors
                      variant="rings"
                      className="pointer-events-none -right-14 -top-12 h-48 w-48 opacity-45"
                    />
                    <DecorativeVectors
                      variant="swirl"
                      tone="whisper"
                      className="pointer-events-none -bottom-20 -left-16 h-56 w-56 max-sm:hidden"
                    />
                    <div className="relative mb-4 flex items-center gap-3" aria-hidden>
                      <span className="h-px w-10 bg-secondary" />
                      <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
                    </div>
                    {closingHeading ? (
                      <h3 className="relative m-0 max-w-xl font-headline-md text-[clamp(1.25rem,2.1vw,1.65rem)] font-light leading-snug tracking-[0.01em] text-primary">
                        {closingHeading}
                      </h3>
                    ) : null}
                    {closingBody ? (
                      <RichText
                        data={closingBody}
                        enableGutter={false}
                        enableProse={false}
                        className={cn(bodyClassName, 'relative mt-5 max-w-xl md:max-w-2xl')}
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
