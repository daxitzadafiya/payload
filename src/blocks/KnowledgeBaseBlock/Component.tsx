import type { Post, KnowledgeBaseBlock as KnowledgeBaseBlockProps } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { formatPublishedDate } from '@/utilities/formatDateTime'

import { getCMSLinkHref } from '@/components/Link'

import {
  KnowledgeBaseBlockClient,
  type KnowledgeArticleItem,
} from './Component.client'

const defaultViewAllLink = {
  type: 'custom' as const,
  url: '/',
  label: 'View All',
}

export const KnowledgeBaseBlock: React.FC<KnowledgeBaseBlockProps> = async (props) => {
  const { subtitle, title, populateBy, limit: limitFromProps, selectedPosts, articles, viewAllLink } =
    props
  const limit = limitFromProps || 3
  const { locale } = await getActiveLocale()

  let resolved: KnowledgeArticleItem[] = []

  if (populateBy === 'manual' && articles?.length) {
    resolved = articles.map((article, index) => ({
      id: `manual-${index}`,
      image: article.image,
      category: article.category,
      title: article.title,
      subtitle: article.subtitle?.replace(/\s/g, ' ') ?? null,
      excerpt: article.excerpt?.replace(/\s/g, ' ') ?? null,
      date: article.publishedAt ? formatPublishedDate(article.publishedAt) : null,
      dateTime: article.publishedAt ?? null,
      link: {
        type: 'custom' as const,
        url: article.url,
        newTab: article.newTab ?? false,
        label: 'Read More',
      },
    }))
  } else if (populateBy === 'selection' && selectedPosts?.length) {
    const postIds = selectedPosts
      .map((post) => (typeof post === 'object' ? post.id : post))
      .filter((id): id is number => typeof id === 'number')

    if (postIds.length) {
      const payload = await getPayload({ config: configPromise })
      const fetched = await payload.find({
        collection: 'posts',
        depth: 1,
        locale,
        limit: postIds.length,
        sort: '-publishedAt',
        where: {
          id: { in: postIds },
          _status: { equals: 'published' },
        },
      })
      resolved = fetched.docs.map(postToArticle)
    }
  } else {
    const payload = await getPayload({ config: configPromise })
    const fetched = await payload.find({
      collection: 'posts',
      depth: 1,
      locale,
      limit,
      sort: '-publishedAt',
      where: {
        _status: {
          equals: 'published',
        },
      },
    })
    resolved = fetched.docs.map(postToArticle)
  }

  if (!resolved.length) return null

  const resolvedViewAllLink =
    viewAllLink && getCMSLinkHref(viewAllLink) ? viewAllLink : defaultViewAllLink

  return (
    <KnowledgeBaseBlockClient
      subtitle={subtitle}
      title={title}
      articles={resolved}
      viewAllLink={resolvedViewAllLink}
    />
  )
}

function postToArticle(post: Post): KnowledgeArticleItem {
  const category =
    post.categories && typeof post.categories[0] === 'object'
      ? post.categories[0].title
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
    link: {
      type: 'reference',
      reference: {
        relationTo: 'posts',
        value: post as Post,
      },
      label: 'Read More',
    },
  }
}
