'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import type { Media as MediaType } from '@/payload-types'
import { CMSLink, getCMSLinkHref, type CMSLinkType } from '@/components/Link'
import { ImageCollage } from '@/components/ImageCollage'
import { useReveal } from '@/utilities/useReveal'

type MediaValue = string | number | MediaType | null | undefined

type Props = {
  subtitle?: string | null
  title?: string | null
  body?: string | null
  buttonText?: string | null
  ctaLink?: CMSLinkType | null
  primaryImage?: MediaValue
  collageImage2?: MediaValue
  collageImage3?: MediaValue
}

const darkCtaClassName =
  'inline-flex w-fit items-center gap-2 rounded-md bg-primary px-8 py-3.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-primary transition-all duration-300 hover:bg-secondary hover:text-on-secondary active:scale-[0.98] sm:text-[12px]'

export const AboutStorySection: React.FC<Props> = ({
  subtitle,
  title,
  body,
  buttonText,
  ctaLink,
  primaryImage,
  collageImage2,
  collageImage3,
}) => {
  const ref = useReveal()
  const href = ctaLink ? getCMSLinkHref(ctaLink) : null
  const showCta = Boolean((buttonText || ctaLink?.label) && href)

  return (
    <section ref={ref} className="relative overflow-hidden bg-surface-cream py-16 md:py-20 lg:py-24">
      <div className="mx-auto grid max-w-max-width grid-cols-1 items-center gap-10 px-margin-mobile md:px-margin-desktop lg:grid-cols-12 lg:gap-12 xl:gap-16">
        <div className="reveal order-2 flex flex-col lg:order-1 lg:col-span-5">
          {subtitle ? (
            <span className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
              {subtitle}
            </span>
          ) : null}

          {title ? (
            <h2 className="m-0 font-headline-lg text-[clamp(1.85rem,3.2vw,2.85rem)] font-light leading-[1.18] tracking-[0.01em] text-primary">
              {title}
            </h2>
          ) : null}

          {body ? (
            <p className="mt-5 m-0 max-w-xl font-body-lg text-[15px] font-light leading-[1.85] text-on-surface/75 md:mt-6 md:text-[16px]">
              {body}
            </p>
          ) : null}

          {showCta && ctaLink ? (
            <div className="mt-7">
              <CMSLink
                {...ctaLink}
                label={null}
                appearance="inline"
                className={darkCtaClassName}
              >
                <span>{buttonText || ctaLink.label}</span>
                <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
              </CMSLink>
            </div>
          ) : null}
        </div>

        <div className="reveal delay-150 order-1 lg:order-2 lg:col-span-7 lg:pl-4">
          <ImageCollage
            primary={primaryImage}
            secondary={collageImage2}
            tertiary={collageImage3}
          />
        </div>
      </div>
    </section>
  )
}
