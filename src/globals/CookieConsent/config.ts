import type { GlobalConfig } from 'payload'

import { a } from '@/utilities/adminI18n'

import { cookieConsentFields } from './fields'
import { autoTranslateCookieConsentContent } from './hooks/autoTranslateCookieConsentContent'
import { revalidateCookieConsent } from './hooks/revalidateCookieConsent'

export const CookieConsent: GlobalConfig = {
  slug: 'cookieConsent',
  label: a('admin.cookieConsent.label', 'Cookie consent'),
  access: {
    read: () => true,
  },
  admin: {
    description: a(
      'admin.cookieConsent.description',
      'Banner shown on the public site until visitors accept or reject cookies. Edit localized copy in English; other locales update via DeepL on save.',
    ),
  },
  fields: cookieConsentFields,
  hooks: {
    afterChange: [autoTranslateCookieConsentContent, revalidateCookieConsent],
  },
}
