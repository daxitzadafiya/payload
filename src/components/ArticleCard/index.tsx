'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'

import { Media } from '@/components/Media'
import { CMSLink, type CMSLinkType } from '@/components/Link'
import type { Media as MediaType } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { useTranslation } from '@/utilities/translateClient'

export type ArticleCardData = {
  image?: MediaType | number | null
  category: string
  title: string
  subtitle?: string | null
  excerpt?: string | null
  date?: string | null
  dateTime?: string | null
}

export type ArticleCardProps = ArticleCardData & {
  className?: string
  style?: React.CSSProperties
  href?: string
  ctaLink?: CMSLinkType
  readMoreLabel?: string
  linkImage?: boolean
  linkTitle?: boolean
}

const ctaClassName =
  'inline-flex items-center gap-1.5 font-label-sm text-tertiary hover:text-primary transition-colors ml-auto shrink-0'

export const ArticleCard: React.FC<ArticleCardProps> = ({
  image,
  category,
  title,
  subtitle,
  excerpt,
  date,
  dateTime,
  className,
  style,
  href,
  ctaLink,
  readMoreLabel,
  linkImage = !!href,
  linkTitle = !!href,
}) => {
  const description = subtitle ?? excerpt
  const categoryLabel = useTranslation('categoryLabel', category)
  const imageElement =
    typeof image === 'object' && image !== null ? (
      <Media
        resource={image}
        fill
        imgClassName="object-cover group-hover:scale-105 transition-transform duration-700"
      />
    ) : null

  return (
    <article
      className={cn(
        'group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300',
        className,
      )}
      style={style}
    >
      {linkImage && href ? (
        <Link href={href} className="relative overflow-hidden aspect-4/3 block">
          {imageElement}
        </Link>
      ) : (
        <div className="relative overflow-hidden aspect-4/3">{imageElement}</div>
      )}

      <div className="flex flex-col grow p-6 md:p-8">
        <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-widest mb-2">
          {categoryLabel}
        </span>
        <h3 className="font-headline-sm text-headline-sm text-primary mb-3 leading-snug">
          {linkTitle && href ? (
            <Link href={href} className="hover:text-tertiary transition-colors">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        {description && (
          <p className="font-body-sm text-body-sm text-secondary line-clamp-3">{description}</p>
        )}
        <div className="grow min-h-6" />
        <div className="flex items-center justify-between gap-4 pt-4">
          {date && (
            <time
              dateTime={dateTime ?? undefined}
              className="inline-flex items-center gap-2 font-label-sm text-label-sm text-secondary shrink-0"
            >
              <Calendar size={14} className="text-secondary/70" aria-hidden />
              {date}
            </time>
          )}
          {href ? (
            <Link href={href} className={ctaClassName}>
              {readMoreLabel}
              <ArrowRight size={14} aria-hidden />
            </Link>
          ) : (
            ctaLink && (
              <CMSLink
                {...ctaLink}
                label={readMoreLabel ?? ctaLink.label}
                appearance="inline"
                className={ctaClassName}
              >
                <ArrowRight size={14} aria-hidden />
              </CMSLink>
            )
          )}
        </div>
      </div>
    </article>
  )
}
