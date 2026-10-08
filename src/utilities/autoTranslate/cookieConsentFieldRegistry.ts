import { cookieConsentFields } from '@/globals/CookieConsent/fields'

import { discoverLocalizedFields } from './discoverFieldPaths'

const discovered = discoverLocalizedFields(cookieConsentFields)

export const COOKIE_CONSENT_FIELD_REGISTRY = {
  strings: discovered.filter((field) => field.kind === 'string').map((field) => field.path),
  richText: discovered.filter((field) => field.kind === 'richtext').map((field) => field.path),
} as const
