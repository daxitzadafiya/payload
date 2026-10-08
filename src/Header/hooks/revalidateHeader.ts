import type { GlobalAfterChangeHook } from 'payload'

import { localeCodes } from '@/i18n/locales'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidateHeader: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (context?.globalTrashAction || context?.disableRevalidate) {
    return doc
  }

  payload.logger.info(`Revalidating header`)

  await revalidateCacheTag('global_header')
  for (const locale of localeCodes) {
    await revalidateCacheTag(`global_header_${locale}`)
  }

  return doc
}
