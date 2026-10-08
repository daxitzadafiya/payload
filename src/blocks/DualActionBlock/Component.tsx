'use client'

import React from 'react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { CMSLink } from '@/components/Link'
import { useTranslation } from '@/utilities/translateClient'

type Props = Extract<Page['layout'][0], { blockType: 'dualActionBlock' }>

type PanelProps = NonNullable<Props['assignPanel']> & {
  variant: 'dark' | 'gold'
}

const ActionPanel: React.FC<PanelProps> = ({
  title,
  description,
  buttonText,
  panelLink,
  variant,
}) => {
  const isDark = variant === 'dark'
  const learnMoreLabel = useTranslation('common.learnMore', 'Learn More')

  return (
    <div
      className={`flex flex-col justify-center items-center px-margin-mobile md:px-12 lg:px-16 py-14 md:py-20 ${
        isDark ? 'bg-primary text-white' : 'bg-tertiary text-white'
      }`}
    >
      {title && (
        <h2 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg mb-4 md:mb-6 leading-tight">
          {title}
        </h2>
      )}
      {description && (
        <p className="font-body-lg text-body-lg text-on-primary-container md:text-white/90 mb-8 md:mb-10 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {panelLink && (
        <CMSLink
          {...panelLink}
          label={buttonText || panelLink.label || learnMoreLabel}
          appearance="inline"
          className={
            'rounded-full ' +
            (isDark
              ? 'inline-flex w-fit px-8 py-3 border border-white text-white font-label-nav text-label-nav uppercase tracking-widest hover:bg-white hover:text-primary transition-all'
              : 'inline-flex w-fit px-8 py-3 bg-primary text-white font-label-nav text-label-nav uppercase tracking-widest hover:opacity-90 transition-all')
          }
        />
      )}
    </div>
  )
}

export const DualActionBlock: React.FC<Props> = ({ assignPanel, searchPanel }) => {
  const ref = useReveal()

  return (
    <section ref={ref} className="reveal">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <ActionPanel {...assignPanel} variant="dark" />
        <ActionPanel {...searchPanel} variant="gold" />
      </div>
    </section>
  )
}
