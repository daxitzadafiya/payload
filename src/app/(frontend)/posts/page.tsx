import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { formatPageTitle, getAppName } from '@/utilities/getAppName'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { t } from '@/utilities/translate'

export const revalidate = 600

export default async function Page() {
  const { locale } = await getActiveLocale()
  const payload = await getPayload({ config: configPromise })
  const postsHeading = await t('posts.heading', locale, 'Posts')

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    locale,
    limit: 12,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
  })

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>{postsHeading}</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const logo = await getCachedGlobal('logo', 0)()

  return {
    title: formatPageTitle('Posts', getAppName(logo)),
  }
}
