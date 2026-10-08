import type { CollectionAfterChangeHook } from 'payload'

import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidateRedirects: CollectionAfterChangeHook = async ({ doc, req: { payload } }) => {
  payload.logger.info(`Revalidating redirects`)

  await revalidateCacheTag('redirects')

  return doc
}
