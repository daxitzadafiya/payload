'use client'

import Link from 'next/link'
import React from 'react'
import { ArrowRight } from 'lucide-react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type Props = Extract<Page['layout'][0], { blockType: 'virtualTourBlock' }>

function getCtaHref(ctaLink: Props['ctaLink']): string | null {
  if (!ctaLink) return null

  if (
    ctaLink.type === 'reference' &&
    typeof ctaLink.reference?.value === 'object' &&
    ctaLink.reference.value &&
    'slug' in ctaLink.reference.value &&
    ctaLink.reference.value.slug
  ) {
    const base = ctaLink.reference.relationTo !== 'pages' ? `/${ctaLink.reference.relationTo}` : ''
    return `${base}/${ctaLink.reference.value.slug}`
  }

  return ctaLink.url || null
}

const ctaClassName =
  'group inline-flex w-fit shrink-0 items-center gap-2 rounded-md bg-primary px-7 py-3.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-primary transition-all duration-300 hover:bg-secondary hover:text-on-secondary active:scale-[0.98] sm:text-[12px]'

export const VirtualTourBlock: React.FC<Props> = ({
  title,
  buttonText,
  ctaLink,
  backgroundImage,
}) => {
  const ref = useReveal()
  const href = getCtaHref(ctaLink)
  const label = buttonText || ctaLink?.label || 'EXPLORE NOW'
  const newTabProps = ctaLink?.newTab
    ? { rel: 'noopener noreferrer' as const, target: '_blank' as const }
    : {}

  return (
    <section ref={ref} className="relative overflow-hidden bg-surface-sand py-16 md:py-20 lg:py-24">
      {/* Divider — separates from the section above */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/55 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="reveal relative pb-6 md:pb-8">
          <div className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2rem]">
            <div className="relative aspect-[16/11] w-full sm:aspect-[16/9] lg:aspect-[2.2/1]">
              {typeof backgroundImage === 'object' && backgroundImage !== null ? (
                <Media resource={backgroundImage} fill imgClassName="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-primary" />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-primary/10"
                aria-hidden
              />
            </div>

            <span
              className="pointer-events-none absolute left-5 top-5 h-9 w-9 border-l-2 border-t-2 border-secondary md:left-7 md:top-7 md:h-11 md:w-11"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute right-5 top-5 h-9 w-9 border-r-2 border-t-2 border-secondary md:right-7 md:top-7 md:h-11 md:w-11"
              aria-hidden
            />
          </div>

          <div className="relative z-10 mx-4 -mt-12 bg-surface-cream px-6 py-7 sm:mx-8 sm:-mt-14 sm:px-8 sm:py-8 md:mx-12 md:-mt-16 lg:mx-16 lg:flex lg:items-end lg:justify-between lg:gap-10 lg:px-10 lg:py-9">
            <div className="max-w-2xl">
              <span className="mb-4 block h-px w-12 bg-secondary" aria-hidden />
              {title ? (
                <h2 className="m-0 font-headline-lg text-[clamp(1.55rem,2.8vw,2.35rem)] font-light leading-[1.22] tracking-[0.01em] text-primary">
                  {title}
                </h2>
              ) : null}
            </div>

            {href ? (
              <div className="mt-6 lg:mt-0 lg:pb-1">
                <Link href={href} className={cn(ctaClassName)} {...newTabProps}>
                  <span>{label}</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    strokeWidth={1.6}
                  />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
