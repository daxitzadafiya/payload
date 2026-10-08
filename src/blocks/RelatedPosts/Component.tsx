import clsx from 'clsx'
import React from 'react'

import type { Post } from '@/payload-types'

import { BlogPostTeaser } from '@/blocks/BlogPostsBlock/BlogPostTeaser'
import { postToItem } from '@/blocks/BlogPostsBlock/postToItem'
import { DecorativeVectors } from '@/components/DecorativeVectors'

export type RelatedPostsProps = {
  className?: string
  docs?: Post[]
  readMoreLabel: string
  title: string
}

export const RelatedPosts: React.FC<RelatedPostsProps> = (props) => {
  const { className, docs, readMoreLabel, title } = props

  const items = docs?.filter((doc): doc is Post => typeof doc === 'object').map(postToItem) ?? []

  if (items.length === 0) return null

  return (
    <section className={clsx('relative overflow-hidden bg-surface-cream py-16 md:py-20 lg:py-24', className)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        aria-hidden
      >
        <span className="h-px w-[min(100%-2rem,72rem)] bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
      </div>

      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="-left-[16%] top-[10%] h-[70%] w-[42%] max-lg:hidden"
      />

      <div className="relative mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop">
        <div className="mb-4 h-px w-16 bg-secondary" aria-hidden />
        <h2 className="mb-10 m-0 max-w-2xl font-headline-lg text-[clamp(1.75rem,3vw,2.5rem)] font-light leading-[1.15] tracking-[0.01em] text-primary md:mb-12">
          {title}
        </h2>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
          {items.map((item) => (
            <BlogPostTeaser key={item.id} {...item} readMoreLabel={readMoreLabel} />
          ))}
        </div>
      </div>
    </section>
  )
}
