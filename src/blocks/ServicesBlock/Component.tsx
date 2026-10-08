'use client'

import React from 'react'
import type { Page } from '@/payload-types'
import { DecorativeVectors } from '@/components/DecorativeVectors'
import { CMSLink, getCMSLinkHref } from '@/components/Link'
import { useReveal } from '@/utilities/useReveal'
import { Award, Handshake, Home, KeyRound, Map, Users } from 'lucide-react'
import { useTranslation } from '@/utilities/translateClient'
import { cn } from '@/utilities/ui'

type Props = Extract<Page['layout'][0], { blockType: 'servicesBlock' }>
type Item = NonNullable<Props['items']>[number]

const iconMap = {
  key: KeyRound,
  map: Map,
  home: Home,
  users: Users,
  handshake: Handshake,
  award: Award,
} as const

const ENGLISH_MORE_INFO = 'More Info'

const ServiceItem: React.FC<{ item: Item; moreInfoLabel: string; index: number }> = ({
  item,
  moreInfoLabel,
  index,
}) => {
  const Icon = iconMap[item.icon || 'key'] || KeyRound
  const cmsLabel = item.buttonText?.trim()
  const buttonLabel =
    !cmsLabel || cmsLabel.toLowerCase() === ENGLISH_MORE_INFO.toLowerCase()
      ? moreInfoLabel
      : cmsLabel
  const href = item.buttonLink ? getCMSLinkHref(item.buttonLink) : null
  const showButton = Boolean(buttonLabel && href && item.buttonLink)

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-secondary/30 bg-surface-container-lowest p-7 sm:p-8 md:rounded-[1.75rem]',
        'shadow-[0_22px_48px_-28px_rgba(0,0,0,0.16)]',
        'transition-all duration-500 ease-out hover:-translate-y-1 hover:border-secondary/55 hover:shadow-[0_28px_56px_-28px_rgba(0,0,0,0.22)]',
      )}
      style={{ transitionDelay: `${Math.min(index, 4) * 50}ms` }}
    >
      <div
        className={cn(
          'mb-6 flex h-12 w-12 items-center justify-center rounded-md border border-secondary/40 bg-secondary/10',
          'text-secondary transition-all duration-500',
          'group-hover:border-secondary group-hover:bg-secondary group-hover:text-on-secondary',
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.35} aria-hidden />
      </div>

      <span className="mb-4 block h-px w-10 bg-secondary" aria-hidden />

      {item.title ? (
        <h3 className="m-0 mb-3 font-label-nav text-[12px] uppercase tracking-[0.18em] text-on-surface">
          {item.title}
        </h3>
      ) : null}

      {item.description ? (
        <p className="m-0 mb-8 flex-1 font-body-md text-[15px] font-light leading-[1.8] text-on-surface/75">
          {item.description}
        </p>
      ) : null}

      {showButton && item.buttonLink ? (
        <CMSLink
          {...item.buttonLink}
          label={buttonLabel}
          appearance="inline"
          className="mt-auto inline-flex w-fit items-center gap-2.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-secondary transition-colors duration-300 hover:text-on-surface before:block before:h-px before:w-5 before:bg-current before:transition-all before:duration-300 hover:before:w-8"
        />
      ) : null}
    </article>
  )
}

export const ServicesBlock: React.FC<Props> = ({ title, description, items }) => {
  const ref = useReveal()
  const moreInfoLabel = useTranslation('common.moreInfo', 'More Info')
  const list = (items ?? []).filter((item) => item && (item.title || item.description))

  if (!title && !description && !list.length) return null

  return (
    <section ref={ref} className="relative overflow-hidden bg-surface-sand py-16 md:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
      </div>
      <DecorativeVectors
        variant="rings"
        className="pointer-events-none -left-20 top-16 h-64 w-64 text-secondary opacity-35 md:h-80 md:w-80"
      />
      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="pointer-events-none -right-[16%] bottom-[6%] h-[55%] w-[40%] text-secondary opacity-30 max-lg:hidden"
      />

      <div className="relative mx-auto w-full max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="reveal mb-12 max-w-2xl md:mb-14">
          <div className="mb-5 flex items-center gap-2.5" aria-hidden>
            <span className="h-px w-10 bg-secondary" />
            <span className="h-1 w-1 rotate-45 bg-secondary" />
          </div>
          {title ? (
            <h2 className="m-0 mb-5 font-headline-lg text-[clamp(1.85rem,3.2vw,2.6rem)] font-light leading-[1.15] tracking-[0.01em] text-on-surface">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="m-0 max-w-xl font-body-lg text-[15px] font-light leading-[1.85] text-on-surface/75 md:text-[16px]">
              {description}
            </p>
          ) : null}
        </div>

        {list.length > 0 ? (
          <div className="reveal delay-150 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
            {list.map((item, index) => (
              <ServiceItem
                key={item.id ?? index}
                item={item}
                moreInfoLabel={moreInfoLabel}
                index={index}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
