import type { GlobalAfterChangeHook } from 'payload'

import { localeCodes } from '@/i18n/locales'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidateFooter: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating footer`)

    await revalidateCacheTag('global_footer')
    for (const locale of localeCodes) {
      await revalidateCacheTag(`global_footer_${locale}`)
    }
  }

  return doc
}
