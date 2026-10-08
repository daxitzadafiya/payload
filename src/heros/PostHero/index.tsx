'use client'

import Link from 'next/link'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import React from 'react'

import type { Post } from '@/payload-types'

import { DecorativeVectors } from '@/components/DecorativeVectors'
import { Media } from '@/components/Media'
import { useReveal } from '@/utilities/useReveal'
import { formatPublishedDate } from '@/utilities/formatDateTime'
import { formatAuthors } from '@/utilities/formatAuthors'

export const PostHero: React.FC<{
  post: Post
  authorLabel: string
  datePublishedLabel: string
  backLabel?: string
}> = ({ post, authorLabel, datePublishedLabel, backLabel = 'Blog' }) => {
  const ref = useReveal()
  const { categories, heroImage, populatedAuthors, publishedAt, subtitle, title } = post

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  const categoryTitle =
    categories && typeof categories[0] === 'object' && categories[0] !== null
      ? categories[0].title || 'News'
      : null

  const heroMedia =
    heroImage && typeof heroImage !== 'string'
      ? heroImage
      : typeof post.meta?.image === 'object'
        ? post.meta.image
        : null

  return (
    <header ref={ref} className="relative overflow-hidden bg-surface-cream pt-24 md:pt-28 lg:pt-32">
      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="pointer-events-none -left-[18%] top-[8%] h-[70%] w-[55%] max-lg:hidden"
      />
      <DecorativeVectors
        variant="rings"
        className="-right-16 top-20 h-72 w-72 md:-right-10 md:top-24 md:h-96 md:w-96"
      />

      <div className="relative mx-auto grid max-w-max-width grid-cols-1 items-center gap-10 px-margin-mobile pb-14 md:gap-12 md:px-margin-desktop md:pb-16 lg:grid-cols-12 lg:gap-14 lg:pb-20">
        {/* Image — visual first on mobile, right column on desktop (Founder / Story pattern) */}
        <div className="reveal relative order-1 lg:order-2 lg:col-span-6">
          {heroMedia ? (
            <div className="relative mx-auto max-w-lg lg:ml-auto lg:mr-0 lg:max-w-none">
              <DecorativeVectors
                variant="grid"
                className="-right-[8%] -top-[10%] h-[70%] w-[55%] max-sm:hidden"
              />
              <div
                className="absolute -right-3 -top-3 h-[92%] w-[92%] rounded-[2rem] border border-secondary/40 md:-right-5 md:-top-5"
                aria-hidden
              />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-surface-sand shadow-[0_28px_60px_-28px_rgba(0,0,0,0.35)] sm:aspect-[5/6] lg:aspect-[4/5]">
                <Media resource={heroMedia} fill priority imgClassName="object-cover" />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2 border-secondary md:left-6 md:top-6 md:h-10 md:w-10"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2 border-secondary md:right-6 md:top-6 md:h-10 md:w-10"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2 border-secondary md:bottom-6 md:left-6 md:h-10 md:w-10"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2 border-secondary md:bottom-6 md:right-6 md:h-10 md:w-10"
                  aria-hidden
                />
              </div>
            </div>
          ) : (
            <div className="relative mx-auto aspect-[4/5] max-w-lg overflow-hidden rounded-[2rem] bg-surface-sand lg:ml-auto lg:mr-0 lg:max-w-none">
              <DecorativeVectors variant="swirl" className="inset-0" />
            </div>
          )}
        </div>

        <div className="reveal delay-150 order-2 flex flex-col lg:order-1 lg:col-span-6">
          <Link
            href="/blog"
            className="mb-7 inline-flex w-fit items-center gap-2 font-label-nav text-[11px] uppercase tracking-[0.2em] text-secondary transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
            <span>{backLabel}</span>
          </Link>

          {categoryTitle ? (
            <span className="mb-4 font-label-nav text-[11px] uppercase tracking-[0.28em] text-secondary sm:text-[12px]">
              {categoryTitle}
            </span>
          ) : null}

          <h1 className="m-0 max-w-xl font-display-lg text-[clamp(2.15rem,4vw,3.5rem)] font-light leading-[1.08] tracking-[0.01em] text-primary">
            {title}
          </h1>

          <div className="mt-6 h-px w-16 bg-secondary" aria-hidden />

          {subtitle ? (
            <p className="mt-6 m-0 max-w-md font-body-lg text-[15px] font-light leading-[1.85] text-on-surface/70 md:text-[16px]">
              {subtitle.replace(/\s/g, ' ')}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-5 md:mt-10">
            {publishedAt ? (
              <div className="flex flex-col gap-1.5">
                <span className="font-label-nav text-[10px] uppercase tracking-[0.2em] text-on-surface/45">
                  {datePublishedLabel}
                </span>
                <time
                  dateTime={publishedAt}
                  className="inline-flex items-center gap-2 font-body-md text-[15px] text-primary"
                >
                  <Calendar size={15} className="shrink-0 text-secondary" aria-hidden strokeWidth={1.5} />
                  {formatPublishedDate(publishedAt)}
                </time>
              </div>
            ) : null}

            {publishedAt && hasAuthors ? (
              <span className="hidden h-9 w-px bg-secondary/35 sm:block" aria-hidden />
            ) : null}

            {hasAuthors ? (
              <div className="flex flex-col gap-1.5">
                <span className="font-label-nav text-[10px] uppercase tracking-[0.2em] text-on-surface/45">
                  {authorLabel}
                </span>
                <span className="inline-flex items-center gap-2 font-body-md text-[15px] text-primary">
                  <User size={15} className="shrink-0 text-secondary" aria-hidden strokeWidth={1.5} />
                  {formatAuthors(populatedAuthors)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
