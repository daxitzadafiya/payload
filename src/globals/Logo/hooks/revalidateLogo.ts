import type { GlobalAfterChangeHook } from 'payload'

import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidateLogo: GlobalAfterChangeHook = async ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating logo`)

    await revalidateCacheTag('global_logo')
  }

  return doc
}
