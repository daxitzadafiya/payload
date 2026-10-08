import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'

import type { Post } from '@/payload-types'

import { PostBody } from '@/heros/PostBody'
import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import type { Locale } from '@/i18n/config'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { t } from '@/utilities/translate'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { locale } = await getActiveLocale()
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug, locale })

  if (!post) return <PayloadRedirects url={url} />

  const [authorLabel, datePublishedLabel, relatedPostsTitle, readMoreLabel, backLabel] =
    await Promise.all([
      t('post.authorLabel', locale, 'Author'),
      t('post.datePublishedLabel', locale, 'Date Published'),
      t('post.relatedPostsTitle', locale, 'Related Articles'),
      t('blog.readMore', locale, 'Read More'),
      t('post.backToBlog', locale, 'Back to Blog'),
    ])

  const relatedPosts = post.relatedPosts?.filter(
    (relatedPost): relatedPost is Post => typeof relatedPost === 'object',
  )

  return (
    <article className="bg-surface-sand">
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PostHero
        post={post}
        authorLabel={authorLabel}
        datePublishedLabel={datePublishedLabel}
        backLabel={backLabel}
      />

      <PostBody content={post.content} />

      {relatedPosts && relatedPosts.length > 0 && (
        <RelatedPosts docs={relatedPosts} readMoreLabel={readMoreLabel} title={relatedPostsTitle} />
      )}
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale } = await getActiveLocale()
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug, locale })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug, locale }: { slug: string; locale: Locale }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    depth: 2,
    draft,
    locale,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
