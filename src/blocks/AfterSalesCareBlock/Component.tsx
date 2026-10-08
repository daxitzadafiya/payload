'use client'

import React from 'react'

import type { Page } from '@/payload-types'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { GoldCornerTicks } from '@/components/GoldCornerTicks'
import RichText from '@/components/RichText'
import { useTranslation } from '@/utilities/translateClient'
import { useReveal } from '@/utilities/useReveal'
import { cn } from '@/utilities/ui'

type Props = Extract<Page['layout'][0], { blockType: 'afterSalesCareBlock' }>

const bodyClassName =
  'ascare-body max-w-none font-body-md text-[15px] font-light leading-[1.9] text-on-surface/75 md:text-[16px] md:leading-[1.95] [&_a]:text-secondary [&_a]:underline-offset-4 hover:[&_a]:text-primary [&_li]:my-1.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-5 [&_p:last-child]:mb-0 [&_strong]:font-medium [&_strong]:text-primary/90 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5'

function formatIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}

export const AfterSalesCareBlock: React.FC<Props> = ({
  eyebrow,
  title,
  lead,
  sectionHeading,
  intro,
  servicesHeading,
  services,
}) => {
  const ref = useReveal()
  const serviceList = (services ?? []).filter((item) => Boolean(item.text?.trim()))
  const supportLabel = useTranslation('afterSales.supportLabel', 'Ongoing support')
  const supportNote = useTranslation(
    'afterSales.supportNote',
    'From the day you receive the keys, our team stays by your side with practical help and personal care.',
  )
  const promiseLabel = useTranslation('afterSales.promiseLabel', 'Our promise')
  const servicesLabel = useTranslation('afterSales.servicesLabel', 'How we help')

  return (
    <div ref={ref}>
      <header className="relative overflow-hidden bg-surface-cream pb-16 pt-28 md:pb-20 md:pt-36 lg:pb-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 65% 50% at 8% 20%, color-mix(in srgb, var(--color-secondary) 28%, transparent), transparent 55%), radial-gradient(ellipse 50% 45% at 92% 75%, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 50%)',
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
            {eyebrow ? (
              <p className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.32em] text-secondary sm:text-[12px]">
                {eyebrow}
              </p>
            ) : null}

            {title ? (
              <h1 className="m-0 max-w-3xl font-display-lg text-[clamp(2.3rem,4.8vw,3.75rem)] font-light leading-[1.05] tracking-[0.01em] text-primary">
                {title}
              </h1>
            ) : null}

            <div className="mt-6 flex items-center gap-4 md:mt-8" aria-hidden>
              <span className="h-px w-16 bg-secondary" />
              <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              <span className="h-px w-10 bg-secondary/40" />
            </div>

            {lead ? (
              <p className="mt-6 m-0 max-w-2xl font-headline-sm text-[clamp(1.1rem,2.1vw,1.45rem)] font-light italic leading-[1.5] tracking-[0.01em] text-secondary md:mt-8">
                {lead}
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
                  {supportLabel}
                </p>
                <p className="mt-3 m-0 font-headline-sm text-[clamp(1.05rem,1.8vw,1.25rem)] font-light leading-snug tracking-[0.01em] text-primary">
                  {sectionHeading || 'After Sales by Zariko'}
                </p>
                <p className="mt-4 m-0 font-body-md text-[13px] font-light leading-[1.7] text-on-surface/65 sm:text-[14px]">
                  {supportNote}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </header>

      {/* Story */}
      <section className="relative overflow-hidden bg-surface-sand pb-10 pt-10 md:pb-12 md:pt-14 lg:pt-16">
        <DecorativeVectors
          variant="grid"
          tone="whisper"
          className="pointer-events-none -left-6 top-20 h-72 w-48 max-lg:hidden"
        />

        <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
          <div className="reveal relative">
            <div
              className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-[1.55rem] border border-secondary/25 md:-inset-x-3 md:-inset-y-3 md:rounded-[1.75rem]"
              aria-hidden
            />
            <article className="relative overflow-hidden rounded-[1.35rem] border border-secondary/20 bg-surface-cream px-5 py-9 shadow-[0_24px_52px_-28px_rgba(0,0,0,0.16)] sm:px-8 sm:py-11 md:rounded-[1.55rem] md:px-11 md:py-14 lg:px-14 lg:py-16">
              <GoldCornerTicks sizeClassName="h-7 w-7 md:h-9 md:w-9" />
              <DecorativeVectors
                variant="swirl"
                tone="whisper"
                className="pointer-events-none -bottom-24 -right-16 h-64 w-64 opacity-25 max-md:hidden"
              />

              <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
                <div className="lg:col-span-4">
                  <p className="m-0 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary">
                    {promiseLabel}
                  </p>
                  <div className="mt-5 h-px w-12 bg-secondary" aria-hidden />
                  {sectionHeading ? (
                    <h2 className="mt-5 m-0 max-w-xs font-headline-sm text-[clamp(1.2rem,2vw,1.5rem)] font-light leading-snug tracking-[0.01em] text-primary">
                      {sectionHeading}
                    </h2>
                  ) : null}
                </div>

                <div className="lg:col-span-8">
                  {intro ? (
                    <RichText
                      data={intro}
                      enableGutter={false}
                      enableProse={false}
                      className={bodyClassName}
                    />
                  ) : null}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Services stage */}
      {(servicesHeading || serviceList.length > 0) && (
        <section className="relative overflow-hidden bg-surface-sand pb-16 pt-2 md:pb-24 md:pt-4 lg:pb-28">
          <DecorativeVectors
            variant="rings"
            className="pointer-events-none -right-16 bottom-8 h-64 w-64 opacity-35 md:h-80 md:w-80"
          />

          <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
            <div className="reveal delay-100 mb-6 md:mb-8">
              <div className="mb-3 flex items-center gap-3" aria-hidden>
                <span className="h-px w-10 bg-secondary" />
                <span className="h-1.5 w-1.5 rotate-45 bg-secondary" />
              </div>
              <p className="m-0 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
                {servicesLabel}
              </p>
              {servicesHeading ? (
                <h2 className="mt-3 m-0 max-w-2xl font-headline-md text-[clamp(1.3rem,2.3vw,1.75rem)] font-light leading-snug tracking-[0.01em] text-primary">
                  {servicesHeading}
                </h2>
              ) : null}
            </div>

            {serviceList.length > 0 ? (
              <div className="reveal delay-150 relative">
                <div
                  className="pointer-events-none absolute -inset-x-2 -inset-y-2 rounded-[1.55rem] border border-secondary/25 md:-inset-x-3 md:-inset-y-3 md:rounded-[1.75rem]"
                  aria-hidden
                />
                <div className="relative overflow-hidden rounded-[1.35rem] border border-secondary/20 bg-surface-cream px-4 py-6 shadow-[0_24px_52px_-28px_rgba(0,0,0,0.16)] sm:px-6 sm:py-8 md:rounded-[1.55rem] md:px-8 md:py-10">
                  <GoldCornerTicks sizeClassName="h-7 w-7 md:h-9 md:w-9" />
                  <ul className="relative m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 sm:gap-3.5 lg:gap-4">
                    {serviceList.map((item, index) => (
                      <li
                        key={item.id || index}
                        className={cn(
                          'group flex items-start gap-4 rounded-xl border border-secondary/15 bg-surface-sand/50 px-4 py-4 transition-colors duration-300',
                          'hover:border-secondary/35 hover:bg-surface-sand',
                        )}
                        style={{ transitionDelay: `${Math.min(index, 8) * 30}ms` }}
                      >
                        <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-secondary/40 bg-surface-cream font-label-nav text-[11px] tracking-[0.08em] text-primary transition-colors group-hover:border-secondary group-hover:bg-secondary group-hover:text-on-secondary">
                          {formatIndex(index)}
                        </span>
                        <span className="min-w-0 flex-1 pt-2 font-body-md text-[14px] font-light leading-[1.7] text-on-surface/75 sm:text-[15px]">
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  )
}
