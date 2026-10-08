import type { GlobalAfterChangeHook } from 'payload'

import { localeCodes } from '@/i18n/locales'
import { syncAdminLanguagesFromLocalization } from '@/i18n/syncAdminLanguagesFromLocalization'
import { seedAdminTranslations } from '@/utilities/adminI18n'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const revalidateLocalization: GlobalAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating localization')
    await revalidateCacheTag('global_localization')
    for (const locale of localeCodes) {
      await revalidateCacheTag(`global_localization_${locale}`)
    }
  }

  let adminLanguageCodes: string[] = ['en']
  try {
    adminLanguageCodes = await syncAdminLanguagesFromLocalization(payload)
  } catch (error) {
    payload.logger.error({ err: error }, '[adminLanguages] Sync after Localization save failed')
  }

  // Fill any newly enabled Account Languages without blocking the save response.
  void seedAdminTranslations(payload, { locales: adminLanguageCodes }).catch((error) => {
    payload.logger.error({ err: error }, '[adminI18n] Seed after Localization save failed')
  })

  return doc
}
