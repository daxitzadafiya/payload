import type { GlobalAfterChangeHook } from 'payload'

import { COOKIE_CONSENT_FIELD_REGISTRY } from '@/utilities/autoTranslate/cookieConsentFieldRegistry'
import { createGlobalAutoTranslateHook } from '@/utilities/autoTranslate/scheduleAutoTranslate'

export const autoTranslateCookieConsentContent: GlobalAfterChangeHook =
  createGlobalAutoTranslateHook({
    slug: 'cookieConsent',
    registry: COOKIE_CONSENT_FIELD_REGISTRY,
  })
