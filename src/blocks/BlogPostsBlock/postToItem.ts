import type { Category, Post } from '@/payload-types'

import { formatPublishedDate } from '@/utilities/formatDateTime'

import type { BlogPostItem } from './Component.client'

export function postToItem(post: Post): BlogPostItem {
  const category =
    post.categories && typeof post.categories[0] === 'object'
      ? (post.categories[0] as Category).title
      : 'News'

  const image =
    (typeof post.meta?.image === 'object' ? post.meta.image : null) ||
    (typeof post.heroImage === 'object' ? post.heroImage : null)

  return {
    id: String(post.id),
    image,
    category: category || 'News',
    title: post.title,
    subtitle: post.subtitle?.replace(/\s/g, ' ') ?? null,
    excerpt: post.meta?.description?.replace(/\s/g, ' ') ?? null,
    date: post.publishedAt ? formatPublishedDate(post.publishedAt) : null,
    dateTime: post.publishedAt ?? null,
    slug: post.slug,
  }
}
