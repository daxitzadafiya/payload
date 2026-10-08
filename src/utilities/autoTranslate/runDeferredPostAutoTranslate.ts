import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { revalidateCachePath, revalidateCacheTag } from '@/utilities/cacheRevalidation'
import type { Post } from '@/payload-types'

import { autoTranslatePost } from './translatePost'

export type DeferredPostAutoTranslateJob = {
  postId: number | string
  slug: string
  doc: Post
  previousDoc?: Post | null
  isDraft: boolean
  sourceLocale: string
}

async function revalidatePublishedPost(slug: string): Promise<void> {
  await revalidateCachePath(`/posts/${slug}`)
  await revalidateCacheTag('posts-sitemap')
}

export async function runDeferredPostAutoTranslate(
  job: DeferredPostAutoTranslateJob,
): Promise<void> {
  const payload = await getPayload({ config: configPromise })

  const { updatedLocales } = await autoTranslatePost({
    payload,
    postId: job.postId,
    sourceDoc: job.doc,
    previousDoc: job.previousDoc,
    skipChangeCheck: true,
    sourceLocale: job.sourceLocale,
    isDraft: job.isDraft,
  })

  if (updatedLocales.length > 0 && !job.isDraft) {
    await revalidatePublishedPost(job.slug)
  }
}
