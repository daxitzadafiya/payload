'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Media } from '@/components/Media'
import type { Media as MediaType } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { useTranslation } from '@/utilities/translateClient'

export type BlogPostTeaserData = {
  id: string
  image?: MediaType | number | null
  category: string
  title: string
  subtitle?: string | null
  excerpt?: string | null
  date?: string | null
  dateTime?: string | null
  slug: string
}

type Props = BlogPostTeaserData & {
  readMoreLabel: string
  featured?: boolean
  className?: string
}

export const BlogPostTeaser: React.FC<Props> = ({
  image,
  category,
  title,
  subtitle,
  excerpt,
  date,
  dateTime,
  slug,
  readMoreLabel,
  featured = false,
  className,
}) => {
  const description = subtitle ?? excerpt
  const categoryLabel = useTranslation('categoryLabel', category)
  const href = `/posts/${slug}`
  const hasImage = typeof image === 'object' && image !== null

  if (featured) {
    return (
      <article
        className={cn(
          'group grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12',
          className,
        )}
      >
        <Link
          href={href}
          className="relative block aspect-[16/10] overflow-hidden rounded-[1.5rem] bg-surface-sand lg:col-span-7 lg:aspect-[4/3]"
        >
          {hasImage ? (
            <Media
              resource={image}
              fill
              imgClassName="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : null}
        </Link>

        <div className="flex flex-col lg:col-span-5">
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-label-nav text-[11px] uppercase tracking-[0.22em] text-secondary">
              {categoryLabel}
            </span>
            {date ? (
              <time
                dateTime={dateTime ?? undefined}
                className="font-label-nav text-[11px] uppercase tracking-[0.14em] text-on-surface/45"
              >
                {date}
              </time>
            ) : null}
          </div>

          <h3 className="m-0 font-headline-lg text-[clamp(1.65rem,2.8vw,2.35rem)] font-light leading-[1.2] tracking-[0.01em] text-primary">
            <Link href={href} className="transition-colors hover:text-secondary">
              {title}
            </Link>
          </h3>

          {description ? (
            <p className="mt-4 m-0 max-w-md font-body-lg text-[15px] font-light leading-[1.8] text-on-surface/70 line-clamp-3 md:text-[16px]">
              {description}
            </p>
          ) : null}

          <Link
            href={href}
            className="mt-6 inline-flex w-fit items-center gap-2 font-label-nav text-[11px] uppercase tracking-[0.16em] text-secondary transition-colors hover:text-primary"
          >
            <span>{readMoreLabel}</span>
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              strokeWidth={1.6}
            />
          </Link>
        </div>
      </article>
    )
  }

  return (
    <article className={cn('group flex flex-col', className)}>
      <Link
        href={href}
        className="relative mb-5 block aspect-[16/10] overflow-hidden rounded-2xl bg-surface-sand"
      >
        {hasImage ? (
          <Media
            resource={image}
            fill
            imgClassName="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : null}
      </Link>

      <span className="mb-2 font-label-nav text-[11px] uppercase tracking-[0.22em] text-secondary">
        {categoryLabel}
      </span>

      <h3 className="m-0 font-headline-sm text-[1.35rem] font-light leading-[1.3] tracking-[0.01em] text-primary">
        <Link href={href} className="transition-colors hover:text-secondary">
          {title}
        </Link>
      </h3>

      {description ? (
        <p className="mt-3 m-0 font-body-md text-[14px] font-light leading-[1.7] text-on-surface/70 line-clamp-2 md:text-[15px]">
          {description}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        {date ? (
          <time
            dateTime={dateTime ?? undefined}
            className="font-label-nav text-[10px] uppercase tracking-[0.14em] text-on-surface/45"
          >
            {date}
          </time>
        ) : (
          <span />
        )}
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 font-label-nav text-[11px] uppercase tracking-[0.14em] text-secondary transition-colors hover:text-primary"
        >
          <span>{readMoreLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} />
        </Link>
      </div>
    </article>
  )
}
