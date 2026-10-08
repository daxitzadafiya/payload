'use client'

import React from 'react'

import { DetailReadMore } from '@/components/DetailReadMore'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  description?: string
}

const bodyClassName =
  'description-container space-y-5 font-body-lg text-[15px] font-light leading-[1.85] text-on-surface/85 md:text-[16px] md:leading-[1.9]'

export const DetailDescription: React.FC<Props> = ({ description }) => {
  const heading = useTranslation('propertyDetail.description.heading', 'About this property')
  const trimmed = description?.trim()
  if (!trimmed) return null

  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed)
  const paragraphs = looksLikeHtml
    ? []
    : trimmed
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)

  return (
    <section className="relative mx-auto mb-16 max-w-max-width px-margin-mobile md:mb-20 md:px-margin-desktop">
      <div className="relative grid grid-cols-1 items-start gap-8 md:grid-cols-12 md:gap-10 lg:gap-14">
        <div className="md:col-span-4 lg:col-span-5">
          <span className="mb-5 block h-px w-12 bg-secondary" aria-hidden />
          <h2 className="m-0 font-headline-lg text-[clamp(1.75rem,2.8vw,2.5rem)] font-light leading-[1.12] tracking-[0.01em] text-primary">
            {heading}
          </h2>
        </div>
        <div className="md:col-span-8 md:border-l md:border-secondary/25 md:pl-10 lg:col-span-7 lg:col-start-6 lg:pl-14">
          <DetailReadMore collapsedHeight={148}>
            {looksLikeHtml ? (
              <div className={bodyClassName} dangerouslySetInnerHTML={{ __html: trimmed }} />
            ) : (
              <div className={bodyClassName}>
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </DetailReadMore>
        </div>
      </div>
    </section>
  )
}
