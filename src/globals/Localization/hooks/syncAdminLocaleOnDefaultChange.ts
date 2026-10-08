import type { GlobalAfterChangeHook } from 'payload'

import { isLocale } from '@/i18n/config'
import { upsertUserLocalePreference } from '@/utilities/upsertUserLocalePreference'

export const syncAdminLocaleOnDefaultChange: GlobalAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const nextDefault = doc?.defaultLocale
  const previousDefault = previousDoc?.defaultLocale

  if (
    typeof nextDefault !== 'string' ||
    !isLocale(nextDefault) ||
    nextDefault === previousDefault ||
    !req.user
  ) {
    return doc
  }

  await upsertUserLocalePreference(req, nextDefault)

  return doc
}
