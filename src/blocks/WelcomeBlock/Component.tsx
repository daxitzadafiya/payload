'use client'

import React from 'react'
import type { Page } from '@/payload-types'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { CMSLink, getCMSLinkHref } from '@/components/Link'
import { useReveal } from '@/utilities/useReveal'

type Props = Extract<Page['layout'][0], { blockType: 'welcomeBlock' }>

const ctaClassName =
  'inline-flex w-fit items-center justify-center rounded-md border border-secondary bg-secondary px-8 py-3.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_30px_-16px_color-mix(in_srgb,var(--color-secondary)_70%,transparent)] transition-all duration-300 hover:border-primary hover:bg-primary hover:text-on-primary hover:shadow-[0_14px_34px_-14px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] active:scale-[0.98] sm:text-[12px]'

export const WelcomeBlock: React.FC<Props> = ({ title, description, buttonText, ctaLink }) => {
  const ref = useReveal()
  const buttonLabel = buttonText?.trim()
  const href = ctaLink ? getCMSLinkHref(ctaLink) : null
  const showCta = Boolean(buttonLabel && href)

  return (
    <section ref={ref} className="relative overflow-hidden bg-surface-cream py-16 md:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
      </div>
      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="pointer-events-none -left-[16%] top-[10%] h-[70%] w-[42%] opacity-45 max-lg:hidden"
      />
      <DecorativeVectors
        variant="rings"
        className="pointer-events-none -right-16 bottom-8 h-56 w-56 opacity-50 md:h-72 md:w-72"
      />

      <div className="relative mx-auto grid max-w-max-width grid-cols-1 items-center gap-10 px-margin-mobile md:grid-cols-12 md:gap-8 md:px-margin-desktop lg:gap-10">
        <div className="reveal md:col-span-5 lg:col-span-5">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <span className="mb-5 block h-px w-14 bg-secondary md:mb-6" aria-hidden />
            {title ? (
              <h2 className="m-0 font-headline-lg text-[clamp(2.1rem,3.8vw,3.25rem)] font-light leading-[1.1] tracking-[0.01em] text-on-surface">
                {title}
              </h2>
            ) : null}
          </div>
        </div>

        <div className="reveal delay-150 md:col-span-7 lg:col-span-6 lg:col-start-7">
          <div className="flex h-full flex-col items-center justify-center gap-7 text-center md:items-start md:border-l md:border-secondary/30 md:pl-10 md:text-left lg:pl-14">
            {description ? (
              <p className="m-0 max-w-xl font-body-lg text-[15px] font-light leading-[1.85] text-on-surface/75 md:text-[16px] md:leading-[1.9]">
                {description}
              </p>
            ) : null}
            {showCta && ctaLink ? (
              <CMSLink {...ctaLink} label={buttonLabel} appearance="inline" className={ctaClassName} />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
