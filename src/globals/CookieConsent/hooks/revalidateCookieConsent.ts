import type { GlobalAfterChangeHook } from 'payload'

import { localeCodes } from '@/i18n/locales'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidateCookieConsent: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating cookie consent`)

    await revalidateCacheTag('global_cookieConsent')
    for (const locale of localeCodes) {
      await revalidateCacheTag(`global_cookieConsent_${locale}`)
    }
  }

  return doc
}
