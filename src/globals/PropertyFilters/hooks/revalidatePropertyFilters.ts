import type { GlobalAfterChangeHook } from 'payload'

import { localeCodes } from '@/i18n/locales'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidatePropertyFilters: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating property filter options')

    await revalidateCacheTag('global_propertyFilters')
    for (const locale of localeCodes) {
      await revalidateCacheTag(`global_propertyFilters_${locale}`)
    }
  }

  return doc
}
