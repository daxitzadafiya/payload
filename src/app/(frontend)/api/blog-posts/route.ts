import { NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { postToItem } from '@/blocks/BlogPostsBlock/postToItem'
import { getActiveLocale } from '@/i18n/getLanguageMenu'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(24, Math.max(1, parseInt(searchParams.get('limit') || '9', 10) || 9))

  try {
    const { locale } = await getActiveLocale()
    const payload = await getPayload({ config: configPromise })

    const postsResult = await payload.find({
      collection: 'posts',
      depth: 1,
      locale,
      limit,
      page,
      sort: '-publishedAt',
      overrideAccess: false,
    })

    return NextResponse.json({
      posts: postsResult.docs.map(postToItem),
      page: postsResult.page ?? page,
      totalPages: postsResult.totalPages,
      totalDocs: postsResult.totalDocs,
    })
  } catch (error) {
    console.error('Blog posts API error:', error)
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
  }
}
