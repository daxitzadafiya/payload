'use client'

import React from 'react'
import type { Page } from '@/payload-types'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { Media } from '@/components/Media'
import { CMSLink, getCMSLinkHref } from '@/components/Link'
import { useReveal } from '@/utilities/useReveal'
import { useTranslation } from '@/utilities/translateClient'

type Props = Extract<Page['layout'][0], { blockType: 'infoCardsBlock' }>
type Card = NonNullable<Props['cards']>[number]

const ENGLISH_VIEW_MORE = 'View More'

const ctaClassName =
  'mt-auto inline-flex w-fit items-center justify-center rounded-md border border-secondary bg-secondary px-7 py-3.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_30px_-16px_color-mix(in_srgb,var(--color-secondary)_70%,transparent)] transition-all duration-300 hover:border-on-surface hover:bg-on-surface hover:text-white hover:shadow-[0_14px_34px_-14px_rgba(0,0,0,0.28)] active:scale-[0.98] sm:text-[12px]'

const InfoCard: React.FC<{ card: Card; viewMoreLabel: string; index: number }> = ({
  card,
  viewMoreLabel,
  index,
}) => {
  const cmsLabel = card.buttonText?.trim()
  const buttonLabel =
    !cmsLabel || cmsLabel.toLowerCase() === ENGLISH_VIEW_MORE.toLowerCase()
      ? viewMoreLabel
      : cmsLabel
  const href = card.buttonLink ? getCMSLinkHref(card.buttonLink) : null
  const showButton = Boolean(buttonLabel && href && card.buttonLink)

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-secondary/30 bg-surface-container-lowest shadow-[0_22px_48px_-28px_rgba(0,0,0,0.16)] transition-all duration-500 hover:-translate-y-1 hover:border-secondary/55 hover:shadow-[0_28px_56px_-28px_rgba(0,0,0,0.22)] md:rounded-[1.75rem]"
      style={{ transitionDelay: `${Math.min(index, 4) * 50}ms` }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-sand">
        {typeof card.image === 'object' && card.image !== null ? (
          <Media
            resource={card.image}
            fill
            imgClassName="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : null}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
          aria-hidden
        />
      </div>

      <div className="flex flex-1 flex-col px-5 py-6 sm:px-6 sm:py-7">
        <span className="mb-4 block h-px w-10 bg-secondary" aria-hidden />

        {card.title ? (
          <h3 className="m-0 mb-3 font-headline-md text-[clamp(1.35rem,2vw,1.65rem)] font-light leading-tight tracking-[0.01em] text-on-surface">
            {card.title}
          </h3>
        ) : null}

        {card.description ? (
          <p className="m-0 mb-7 flex-1 font-body-md text-[15px] font-light leading-[1.8] text-on-surface/75">
            {card.description}
          </p>
        ) : null}

        {showButton && card.buttonLink ? (
          <CMSLink
            {...card.buttonLink}
            label={buttonLabel}
            appearance="inline"
            className={ctaClassName}
          />
        ) : null}
      </div>
    </article>
  )
}

export const InfoCardsBlock: React.FC<Props> = ({ cards }) => {
  const ref = useReveal()
  const viewMoreLabel = useTranslation('common.viewMore', 'View More')
  const items = (cards ?? []).filter((card) => card && (card.title || card.image))

  if (!items.length) return null

  return (
    <section ref={ref} className="relative overflow-hidden bg-surface-sand py-16 md:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
      </div>
      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="pointer-events-none -left-[16%] top-[12%] h-[55%] w-[40%] text-secondary opacity-30 max-lg:hidden"
      />
      <DecorativeVectors
        variant="rings"
        className="pointer-events-none -right-16 bottom-10 h-56 w-56 text-secondary opacity-35 md:h-72 md:w-72"
      />

      <div className="relative mx-auto w-full max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="reveal grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
          {items.map((card, index) => (
            <InfoCard
              key={card.id ?? index}
              card={card}
              viewMoreLabel={viewMoreLabel}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
