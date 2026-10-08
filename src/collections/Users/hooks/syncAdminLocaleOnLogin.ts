import type { CollectionAfterLoginHook } from 'payload'

import { getSiteDefaultLocale } from '@/i18n/getSiteDefaultLocale'
import { upsertUserLocalePreference } from '@/utilities/upsertUserLocalePreference'

export const syncAdminLocaleOnLogin: CollectionAfterLoginHook = async ({ req }) => {
  const siteDefaultLocale = await getSiteDefaultLocale(req.payload)
  await upsertUserLocalePreference(req, siteDefaultLocale)
}
