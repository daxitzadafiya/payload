import type { GlobalAfterChangeHook } from 'payload'

import { revalidateCachePath, revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidateTheme: GlobalAfterChangeHook = async ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating theme`)

    await revalidateCacheTag('global_theme')
    await revalidateCachePath('/')
    // Admin chrome (and auth pages) read Theme CSS via AdminThemeStyles.
    await revalidateCachePath('/admin')
  }

  return doc
}
