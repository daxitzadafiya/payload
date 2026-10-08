'use client'

import React from 'react'
import { ArrowRight, Award, Calendar, Clock, Home, Users } from 'lucide-react'
import type { AboutUsHeroBlock as AboutUsHeroBlockType } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { useRegisterHeroOverlay } from '@/providers/HeroOverlay'
import { Media } from '@/components/Media'
import { CMSLink, getCMSLinkHref } from '@/components/Link'

type Props = AboutUsHeroBlockType & {
  disableInnerContainer?: boolean
}

const iconMap = {
  calendar: Calendar,
  users: Users,
  award: Award,
  clock: Clock,
  home: Home,
}

const goldCtaClassName =
  'inline-flex w-fit items-center gap-2 rounded-md bg-secondary px-8 py-3.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary transition-all duration-300 hover:bg-primary hover:text-on-primary active:scale-[0.98] sm:text-[12px]'

const HeadlineWithAccent: React.FC<{ text: string }> = ({ text }) => {
  const match =
    text.match(/\b(find\s+home)\b/i) ?? text.match(/\b(find)\b/i) ?? text.match(/\b(home)\b/i)

  if (!match || match.index == null) {
    return <>{text}</>
  }

  const start = match.index
  const end = start + match[0].length

  return (
    <>
      {text.slice(0, start)}
      <em className="italic font-light text-secondary whitespace-nowrap">{text.slice(start, end)}</em>
      {text.slice(end)}
    </>
  )
}

export const AboutUsHeroBlock: React.FC<Props> = ({
  label,
  headline,
  description,
  buttonText,
  ctaLink,
  backgroundImage,
  stats,
}) => {
  const ref = useReveal()
  useRegisterHeroOverlay()

  const href = ctaLink ? getCMSLinkHref(ctaLink) : null
  const showCta = Boolean(buttonText && href)
  const visibleStats = (stats ?? []).filter((stat) => stat?.value || stat?.label)

  return (
    <section
      ref={ref}
      className="relative flex min-h-[24rem] w-full flex-col overflow-hidden md:min-h-[min(52vh,32rem)]"
    >
      {typeof backgroundImage === 'object' && backgroundImage !== null ? (
        <div className="absolute inset-0">
          <Media
            resource={backgroundImage}
            fill
            priority
            imgClassName="object-cover object-center"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-primary" />
      )}

      <div className="about-hero-gradient absolute inset-0 z-10" aria-hidden />

      <div className="relative z-20 flex w-full flex-1 flex-col justify-end md:justify-center">
        <div className="mx-auto w-full max-w-max-width px-margin-mobile pb-32 pt-28 md:px-margin-desktop md:pb-24 md:pt-32 lg:pb-20">
          <div className="reveal max-w-[32rem] lg:max-w-[38rem]">
            {label ? (
              <p className="mb-3 font-label-nav text-[11px] uppercase tracking-[0.32em] text-secondary sm:mb-4 sm:text-[12px]">
                {label}
              </p>
            ) : null}

            {headline ? (
              <h1 className="m-0 font-display-lg text-[clamp(1.85rem,3.8vw,3.1rem)] font-light leading-[1.15] tracking-[0.01em] text-white whitespace-pre-line">
                <HeadlineWithAccent text={headline} />
              </h1>
            ) : null}

            {description ? (
              <p className="mt-4 m-0 max-w-md font-body-lg text-[14px] font-light leading-[1.75] text-white/78 md:mt-5 md:text-[15px] md:leading-[1.8]">
                {description}
              </p>
            ) : null}

            {showCta && ctaLink ? (
              <div className="mt-6 md:mt-7">
                <CMSLink {...ctaLink} label={null} appearance="inline" className={goldCtaClassName}>
                  <span>{buttonText}</span>
                  <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
                </CMSLink>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {visibleStats.length > 0 ? (
        <div className="absolute bottom-4 right-margin-mobile z-20 max-w-[calc(100%-2rem)] md:bottom-8 md:right-margin-desktop">
          <div className="flex max-w-full flex-wrap justify-end divide-x divide-white/15 bg-black/60 backdrop-blur-md">
            {visibleStats.map((stat, idx) => {
              const Icon = iconMap[stat.icon || 'award'] || Award
              return (
                <div
                  key={stat.id ?? idx}
                  className="flex max-w-[9.5rem] flex-col items-center gap-1 px-2.5 py-3 text-center sm:max-w-none sm:min-w-[7.75rem] sm:gap-1.5 sm:px-5 sm:py-4"
                >
                  <Icon className="h-4 w-4 text-secondary" strokeWidth={1.25} />
                  <p className="m-0 font-headline-sm text-[1.05rem] font-light leading-none text-white sm:text-[1.25rem]">
                    {stat.value}
                  </p>
                  <p className="m-0 max-w-[8.5rem] font-label-nav text-[8px] uppercase leading-snug tracking-[0.12em] text-white/70 sm:max-w-[9.5rem] sm:text-[9px] sm:tracking-[0.16em]">
                    {stat.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
