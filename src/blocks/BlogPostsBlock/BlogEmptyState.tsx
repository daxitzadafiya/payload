'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/utilities/ui'

import { CMSLink, type CMSLinkType } from '@/components/Link'
import { useTranslation } from '@/utilities/translateClient'

type BlogEmptyStateProps = {
  eyebrow?: string
  title?: string
  description?: string
  ctaLink?: CMSLinkType | null
  className?: string
}

export const BlogEmptyState: React.FC<BlogEmptyStateProps> = ({
  eyebrow,
  title,
  description,
  ctaLink,
  className,
}) => {
  const defaultEyebrow = useTranslation('blog.empty.eyebrow', 'No Results')
  const defaultTitle = useTranslation('blog.empty.title', 'No posts found')
  const defaultDescription = useTranslation(
    'blog.empty.description',
    'There are no articles published yet. Please check back soon for new content.',
  )
  const hasCta = ctaLink && (ctaLink.url || ctaLink.reference)

  return (
    <div className={cn('relative w-full py-10 text-center md:py-14', className)}>
      <span className="mx-auto mb-5 block h-px w-12 bg-secondary" aria-hidden />

      <span className="font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
        {eyebrow ?? defaultEyebrow}
      </span>

      <h3 className="mx-auto mt-4 max-w-lg font-headline-lg text-[clamp(1.65rem,2.8vw,2.25rem)] font-light leading-[1.2] text-primary">
        {title ?? defaultTitle}
      </h3>

      <p className="mx-auto mt-4 max-w-md font-body-lg text-[15px] font-light leading-[1.8] text-on-surface/70">
        {description ?? defaultDescription}
      </p>

      {hasCta && ctaLink ? (
        <div className="mt-8">
          <CMSLink
            {...ctaLink}
            appearance="inline"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3.5 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-primary transition-all duration-300 hover:bg-secondary hover:text-on-secondary"
          >
            <ArrowRight size={16} aria-hidden strokeWidth={1.6} />
          </CMSLink>
        </div>
      ) : null}
    </div>
  )
}
