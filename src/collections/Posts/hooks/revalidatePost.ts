import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateCachePath, revalidateCacheTag } from '@/utilities/cacheRevalidation'

import type { Post } from '../../../payload-types'

async function revalidatePostPath(path: string): Promise<void> {
  await revalidateCachePath(path)
  await revalidateCacheTag('posts-sitemap')
}

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      await revalidatePostPath(path)
    }

    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/posts/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      await revalidatePostPath(oldPath)
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/posts/${doc?.slug}`

    await revalidatePostPath(path)
  }

  return doc
}
