import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateCachePath, revalidateCacheTag } from '@/utilities/cacheRevalidation'

import type { Page } from '../../../payload-types'

async function revalidatePagePath(path: string): Promise<void> {
  await revalidateCachePath(path)
  await revalidateCacheTag('pages-sitemap')
}

export const revalidatePage: CollectionAfterChangeHook<Page> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = doc.slug === 'home' ? '/' : `/${doc.slug}`

      payload.logger.info(`Revalidating page at path: ${path}`)

      await revalidatePagePath(path)
    }

    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`

      payload.logger.info(`Revalidating old page at path: ${oldPath}`)

      await revalidatePagePath(oldPath)
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = async ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`
    await revalidatePagePath(path)
  }

  return doc
}
