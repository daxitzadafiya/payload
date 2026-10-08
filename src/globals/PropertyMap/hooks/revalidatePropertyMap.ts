import type { GlobalAfterChangeHook } from 'payload'

import { localeCodes } from '@/i18n/locales'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidatePropertyMap: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating property map settings')

    await revalidateCacheTag('global_propertyMap')
    for (const locale of localeCodes) {
      await revalidateCacheTag(`global_propertyMap_${locale}`)
    }
  }

  return doc
}
