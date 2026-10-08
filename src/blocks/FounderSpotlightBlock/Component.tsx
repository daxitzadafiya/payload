'use client'

import React from 'react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'

type Props = Extract<Page['layout'][0], { blockType: 'founderSpotlightBlock' }>

export const FounderSpotlightBlock: React.FC<Props> = ({
  subtitle,
  name,
  role,
  quote,
  bio,
  portrait,
}) => {
  const ref = useReveal()

  const bioParagraphs = bio
    ? bio
        .split(/\n\s*\n|\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : []

  return (
    <section ref={ref} className="relative overflow-hidden bg-surface-sand py-16 md:py-20 lg:py-24">
      <div
        className="about-ring-breathe pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full border border-secondary/25 md:h-96 md:w-96"
        aria-hidden
      />
      <div
        className="about-ring-breathe about-ring-breathe-delay pointer-events-none absolute -left-8 top-24 h-56 w-56 rounded-full border border-secondary/15 md:h-72 md:w-72"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-max-width grid-cols-1 items-center gap-10 px-margin-mobile md:px-margin-desktop lg:grid-cols-12 lg:gap-14">
        <div className="reveal relative order-1 lg:order-2 lg:col-span-6">
          <div className="relative mx-auto max-w-md lg:ml-auto lg:mr-0 lg:max-w-none">
            <div className="absolute -right-3 -top-3 h-[92%] w-[92%] rounded-[2rem] border border-secondary/40 md:-right-5 md:-top-5" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-surface-cream shadow-[0_28px_60px_-28px_rgba(0,0,0,0.35)]">
              {typeof portrait === 'object' && portrait !== null ? (
                <Media resource={portrait} fill priority imgClassName="object-cover object-top" />
              ) : (
                <div className="absolute inset-0 bg-surface-cream" />
              )}
            </div>
          </div>
        </div>

        <div className="reveal delay-150 order-2 flex flex-col lg:order-1 lg:col-span-6">
          {subtitle ? (
            <span className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
              {subtitle}
            </span>
          ) : null}

          <h2 className="m-0 font-display-lg text-[clamp(2.4rem,4.2vw,3.75rem)] font-light leading-[1.08] tracking-[0.01em] text-primary">
            {name}
          </h2>

          {role ? (
            <p className="mt-3 m-0 font-label-nav text-[11px] uppercase tracking-[0.2em] text-on-surface/55">
              {role}
            </p>
          ) : null}

          <div className="mt-7 h-px w-16 bg-secondary" aria-hidden />

          {quote ? (
            <blockquote className="mt-7 m-0">
              <p className="m-0 max-w-xl font-headline-md text-[clamp(1.2rem,2vw,1.65rem)] font-light italic leading-[1.45] tracking-[0.01em] text-primary/90">
                &ldquo;{quote}&rdquo;
              </p>
            </blockquote>
          ) : null}

          {bioParagraphs.length > 0 ? (
            <div className="mt-7 flex max-w-xl flex-col gap-4">
              {bioParagraphs.map((paragraph, idx) => (
                <p
                  key={idx}
                  className="m-0 font-body-lg text-[15px] font-light leading-[1.85] text-on-surface/75 md:text-[16px]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
