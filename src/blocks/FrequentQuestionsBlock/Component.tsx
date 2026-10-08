'use client'

import React, { useCallback, useMemo } from 'react'

import type { Page } from '@/payload-types'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { GoldCornerTicks } from '@/components/GoldCornerTicks'
import RichText from '@/components/RichText'
import { useReveal } from '@/utilities/useReveal'
import { cn } from '@/utilities/ui'

type Props = Extract<Page['layout'][0], { blockType: 'frequentQuestionsBlock' }>
type FaqItem = NonNullable<Props['items']>[number]

const faqBodyClassName =
  'faq-body max-w-none font-body-md text-[15px] font-light leading-[1.85] text-on-surface/75 [&_a]:text-secondary [&_a]:underline-offset-2 hover:[&_a]:text-primary [&_li]:my-1.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-medium [&_strong]:text-on-surface/90 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5'

function formatIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}

function itemAnchorId(index: number) {
  return `faq-q-${index}`
}

function truncateQuestion(text: string, max = 52) {
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}

const FaqAccordionItem: React.FC<{
  item: FaqItem
  index: number
  open: boolean
  onToggle: () => void
}> = ({ item, index, open, onToggle }) => {
  const panelId = `faq-panel-${item.id || index}`
  const buttonId = `faq-button-${item.id || index}`

  return (
    <article
      id={itemAnchorId(index)}
      className={cn(
        'group relative scroll-mt-32 rounded-[1.15rem] border transition-all duration-500 md:rounded-[1.25rem]',
        open
          ? 'border-secondary/45 bg-surface-cream shadow-[0_18px_44px_-24px_rgba(0,0,0,0.22)]'
          : 'border-secondary/15 bg-surface-cream/70 hover:border-secondary/30 hover:bg-surface-cream hover:shadow-[0_12px_32px_-24px_rgba(0,0,0,0.14)]',
      )}
      style={{ transitionDelay: `${Math.min(index, 6) * 35}ms` }}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-full bg-secondary transition-opacity duration-300 md:inset-y-4',
          open ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
        )}
        aria-hidden
      />

      <h3 className="relative m-0">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-start gap-3.5 px-4 py-4 text-left sm:gap-4 sm:px-5 sm:py-5 md:px-6 md:py-5"
        >
          <span
            className={cn(
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-label-nav text-[11px] tracking-[0.12em] transition-all duration-300 sm:h-10 sm:w-10 sm:text-[12px]',
              open
                ? 'border-primary bg-primary text-on-primary shadow-[0_8px_20px_-12px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]'
                : 'border-secondary/35 bg-surface-sand text-secondary group-hover:border-secondary group-hover:text-primary',
            )}
          >
            {formatIndex(index)}
          </span>

          <span
            className={cn(
              'min-w-0 flex-1 pt-0.5 font-headline-sm text-[clamp(1.02rem,1.75vw,1.22rem)] font-light leading-snug tracking-[0.01em] transition-colors duration-300',
              open ? 'text-primary' : 'text-on-surface group-hover:text-primary',
            )}
          >
            {item.question}
          </span>

          <span
            className={cn(
              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 sm:mt-1',
              open
                ? 'rotate-45 border-secondary/50 bg-secondary/15 text-primary'
                : 'border-secondary/30 text-secondary group-hover:border-secondary group-hover:text-primary',
            )}
            aria-hidden
          >
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M8 3v10M3 8h10" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          'grid transition-[grid-template-rows] duration-400 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          {item.answer ? (
            <div className="border-t border-secondary/15 px-4 pb-5 pt-1 sm:px-5 sm:pb-6 md:px-6 md:pb-7 md:pl-[4.75rem]">
              <RichText
                data={item.answer}
                enableGutter={false}
                enableProse={false}
                className={faqBodyClassName}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export const FrequentQuestionsBlock: React.FC<Props> = ({
  eyebrow,
  title,
  lead,
  introHeading,
  intro,
  items,
}) => {
  const ref = useReveal()
  const list = items || []
  const [openIndex, setOpenIndex] = React.useState<number | null>(list.length ? 0 : null)

  const jumpToQuestion = useCallback((index: number) => {
    setOpenIndex(index)
    requestAnimationFrame(() => {
      document.getElementById(itemAnchorId(index))?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [])

  const navEntries = useMemo(
    () =>
      list.map((item, index) => ({
        index,
        id: item.id || String(index),
        label: item.question || `Question ${formatIndex(index)}`,
      })),
    [list],
  )

  return (
    <div ref={ref}>
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

        <div className="relative mx-auto grid max-w-max-width grid-cols-1 items-end gap-10 px-margin-mobile md:grid-cols-12 md:gap-8 md:px-margin-desktop lg:gap-12">
          <div className="reveal md:col-span-7 lg:col-span-8">
            {eyebrow ? (
              <p className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.32em] text-secondary sm:text-[12px]">
                {eyebrow}
              </p>
            ) : null}

            {title ? (
              <h1 className="m-0 max-w-3xl font-display-lg text-[clamp(2.25rem,4.6vw,3.6rem)] font-light leading-[1.1] tracking-[0.01em] text-primary">
                {title}
              </h1>
            ) : null}

            <div className="mt-6 flex items-center gap-4 md:mt-8" aria-hidden>
              <span className="h-px w-14 bg-secondary" />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              <span className="h-px w-8 bg-secondary/40" />
            </div>

            {lead ? (
              <p className="mt-6 m-0 max-w-2xl font-headline-sm text-[clamp(1.05rem,1.9vw,1.35rem)] font-light italic leading-[1.55] text-secondary md:mt-8">
                &ldquo;{lead.replace(/^["“]|["”]$/g, '')}&rdquo;
              </p>
            ) : null}
          </div>

          {navEntries.length > 0 ? (
            <div className="reveal delay-150 md:col-span-5 lg:col-span-4">
              <div className="relative overflow-hidden rounded-[1.35rem] border border-secondary/25 bg-surface-sand/70 px-5 py-6 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.18)] sm:px-6 md:rounded-[1.5rem] md:px-7 md:py-7">
                <div
                  className="pointer-events-none absolute -inset-x-1.5 -inset-y-1.5 rounded-[1.5rem] border border-secondary/15 md:-inset-x-2 md:-inset-y-2 md:rounded-[1.65rem]"
                  aria-hidden
                />
                <DecorativeVectors
                  variant="rings"
                  tone="whisper"
                  className="pointer-events-none -right-10 -top-8 h-32 w-32 opacity-40"
                />

                <p className="relative m-0 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary">
                  Quick topics
                </p>
                <p className="relative mt-2 m-0 font-headline-sm text-[1.15rem] font-light text-primary">
                  {navEntries.length} questions answered
                </p>

                <nav className="relative mt-5 flex flex-col gap-0.5" aria-label="Quick topics">
                  {navEntries.slice(0, 6).map(({ index, id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => jumpToQuestion(index)}
                      className={cn(
                        'group flex items-baseline gap-3 rounded-md py-1.5 pl-1 text-left font-label-nav text-[10px] uppercase tracking-[0.08em] transition-colors sm:text-[11px]',
                        openIndex === index
                          ? 'text-primary'
                          : 'text-on-surface/55 hover:text-primary',
                      )}
                    >
                      <span
                        className={cn(
                          'shrink-0 tabular-nums',
                          openIndex === index ? 'text-secondary' : 'text-secondary/65',
                        )}
                      >
                        {formatIndex(index)}
                      </span>
                      <span className="truncate group-hover:underline group-hover:decoration-secondary/45 group-hover:underline-offset-4">
                        {truncateQuestion(label, 44)}
                      </span>
                    </button>
                  ))}
                  {navEntries.length > 6 ? (
                    <button
                      type="button"
                      onClick={() => jumpToQuestion(6)}
                      className="mt-1 py-1 pl-1 text-left font-label-nav text-[10px] uppercase tracking-[0.14em] text-secondary transition-colors hover:text-primary sm:text-[11px]"
                    >
                      + {navEntries.length - 6} more below
                    </button>
                  ) : null}
                </nav>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <section className="relative overflow-hidden bg-surface-sand pb-16 pt-10 md:pb-24 md:pt-12 lg:pb-28">
        <DecorativeVectors
          variant="grid"
          tone="whisper"
          className="pointer-events-none -left-8 top-24 h-80 w-52 max-lg:hidden"
        />
        <DecorativeVectors
          variant="swirl"
          tone="whisper"
          className="pointer-events-none -right-[16%] bottom-[8%] h-[48%] w-[38%] max-md:hidden"
        />

        {navEntries.length > 0 ? (
          <div className="reveal relative mb-8 md:hidden">
            <div className="px-margin-mobile">
              <p className="mb-3 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary">
                Jump to topic
              </p>
            </div>
            <nav
              className="flex gap-2 overflow-x-auto px-margin-mobile pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Jump to topic"
            >
              {navEntries.map(({ index, id, label }) => {
                const active = openIndex === index
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => jumpToQuestion(index)}
                    className={cn(
                      'shrink-0 rounded-md px-3.5 py-2 font-label-nav text-[11px] uppercase tracking-[0.1em] transition-colors',
                      active
                        ? 'bg-primary text-on-primary shadow-[0_8px_20px_-12px_color-mix(in_srgb,var(--color-primary)_65%,transparent)]'
                        : 'border border-secondary/25 bg-surface-cream/90 text-on-surface/60',
                    )}
                  >
                    {formatIndex(index)}. {truncateQuestion(label, 28)}
                  </button>
                )
              })}
            </nav>
          </div>
        ) : null}

        <div className="relative mx-auto flex max-w-max-width flex-col gap-10 px-margin-mobile md:flex-row md:gap-10 md:px-margin-desktop lg:gap-14">
          {navEntries.length > 0 ? (
            <aside className="hidden md:block md:w-[26%] lg:w-[24%]">
              <div className="reveal sticky top-28">
                <div className="mb-5 flex items-center gap-3" aria-hidden>
                  <span className="h-px w-6 bg-secondary/60" />
                  <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
                </div>
                <h3 className="mb-5 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
                  All topics
                </h3>
                <nav className="flex flex-col" aria-label="All topics">
                  {navEntries.map(({ index, id, label }) => {
                    const active = openIndex === index
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => jumpToQuestion(index)}
                        className={cn(
                          'group flex items-start gap-3 border-l py-3 pl-4 text-left transition-colors duration-300',
                          active
                            ? 'border-secondary text-primary'
                            : 'border-secondary/20 text-on-surface/50 hover:border-secondary/45 hover:text-primary',
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 shrink-0 font-label-nav text-[10px] tabular-nums tracking-[0.08em]',
                            active ? 'text-secondary' : 'text-secondary/50',
                          )}
                        >
                          {formatIndex(index)}
                        </span>
                        <span className="font-label-nav text-[11px] uppercase leading-snug tracking-[0.08em] sm:text-[12px]">
                          {truncateQuestion(label, 36)}
                        </span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </aside>
          ) : null}

          <div className="min-w-0 flex-1">
            {(introHeading || intro) && (
              <div className="reveal relative mb-8 md:mb-10">
                <div
                  className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-[1.45rem] border border-secondary/25 md:-inset-x-3 md:-inset-y-3 md:rounded-[1.65rem]"
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-[1.3rem] border border-secondary/20 bg-surface-cream px-5 py-7 shadow-[0_20px_48px_-28px_rgba(0,0,0,0.16)] sm:px-7 sm:py-8 md:rounded-[1.5rem] md:px-8 md:py-9">
                  <GoldCornerTicks sizeClassName="h-7 w-7 md:h-9 md:w-9" />
                  <DecorativeVectors
                    variant="rings"
                    tone="whisper"
                    className="pointer-events-none -right-12 -top-10 h-40 w-40 opacity-35"
                  />

                  {introHeading ? (
                    <h2 className="relative m-0 mb-5 max-w-2xl font-headline-md text-[clamp(1.3rem,2.1vw,1.7rem)] font-light leading-snug tracking-[0.01em] text-primary">
                      {introHeading}
                    </h2>
                  ) : null}

                  {intro ? (
                    <RichText
                      data={intro}
                      enableGutter={false}
                      enableProse={false}
                      className={cn(faqBodyClassName, '[&_p]:mb-4 [&_p:last-child]:mb-0')}
                    />
                  ) : null}
                </div>
              </div>
            )}

            <div className="reveal delay-100 relative flex flex-col gap-3 md:gap-3.5">
              {list.map((item, index) => (
                <FaqAccordionItem
                  key={item.id || index}
                  item={item}
                  index={index}
                  open={openIndex === index}
                  onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
