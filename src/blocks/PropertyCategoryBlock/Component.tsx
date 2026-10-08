'use client'

import React from 'react'
import Link from 'next/link'
import type { Page } from '@/payload-types'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { Media } from '@/components/Media'
import { getCMSLinkHref } from '@/components/Link'
import { useReveal } from '@/utilities/useReveal'
import { cn } from '@/utilities/ui'

type Props = Extract<Page['layout'][0], { blockType: 'propertyCategoryBlock' }>
type Card = NonNullable<Props['cards']>[number]

const CategoryCard: React.FC<{ card: Card; index: number }> = ({ card, index }) => {
  const href = card.cardLink ? getCMSLinkHref(card.cardLink) : null
  const title = card.title?.trim()
  const suffix = card.titleSuffix?.trim() || 'Properties'
  const subtitle = card.subtitle?.trim()

  const titleLooksComplete = Boolean(
    title && suffix && title.toLowerCase().endsWith(suffix.toLowerCase()),
  )
  const showSuffix = Boolean(suffix && !titleLooksComplete)

  const cardClassName = cn(
    'group relative block h-full min-h-[17rem] overflow-hidden rounded-[1.5rem] bg-black text-white shadow-[0_28px_60px_-32px_rgba(0,0,0,0.35)] sm:min-h-[19rem] md:rounded-[1.75rem] lg:min-h-[23rem]',
    'transition-transform duration-700 ease-out hover:-translate-y-1',
    href
      ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-sand'
      : '',
  )

  const cardContent = (
    <>
      <div className="absolute inset-0">
        {typeof card.image === 'object' && card.image !== null ? (
          <Media
            resource={card.image}
            fill
            imgClassName="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
          />
        ) : (
          <div className="h-full w-full bg-surface-container" />
        )}
      </div>

      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-700 group-hover:from-black/90"
        aria-hidden
      />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-start p-5 sm:p-6 lg:p-7">
        <span
          className="mb-3 h-px w-8 origin-left scale-x-75 bg-secondary transition-transform duration-500 group-hover:scale-x-100"
          aria-hidden
        />
        <h3 className="m-0 font-headline-md text-[clamp(1.3rem,2vw,1.7rem)] font-light leading-tight tracking-[0.02em] text-white [text-shadow:0_1px_16px_rgba(0,0,0,0.45)]">
          {title ? <span>{title}</span> : null}
          {title && showSuffix ? ' ' : null}
          {showSuffix ? <span className="text-secondary">{suffix}</span> : null}
        </h3>
        {subtitle ? (
          <p
            className={cn(
              'm-0 max-w-sm font-body-md text-[13px] font-light leading-relaxed text-white/85 sm:text-[14px]',
              'max-h-0 overflow-hidden opacity-0 transition-all duration-500 ease-out',
              'group-hover:mt-3 group-hover:max-h-24 group-hover:opacity-100',
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cardClassName} style={{ transitionDelay: `${index * 40}ms` }}>
        {cardContent}
      </Link>
    )
  }

  return (
    <article
      className={cardClassName}
      aria-label={title || undefined}
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      {cardContent}
    </article>
  )
}

export const PropertyCategoryBlock: React.FC<Props> = ({ cards }) => {
  const ref = useReveal()
  const items = (cards ?? []).filter((card) => card && (card.title || card.image))

  if (!items.length) return null

  return (
    <section ref={ref} className="relative overflow-hidden bg-surface-sand py-14 md:py-16 lg:py-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
      </div>
      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="pointer-events-none -right-[14%] top-[8%] h-[60%] w-[40%] text-secondary opacity-35 max-lg:hidden"
      />

      <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div
          className={cn(
            'reveal grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6',
            items.length >= 3 ? 'lg:grid-cols-3' : '',
          )}
        >
          {items.map((card, index) => (
            <CategoryCard key={card.id ?? index} card={card} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
