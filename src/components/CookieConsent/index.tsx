import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import type { CookieConsent as CookieConsentGlobal } from '@/payload-types'

import { CookieBanner } from './CookieBanner'

export async function CookieConsent() {
  const { locale } = await getActiveLocale()
  const data = (await getCachedGlobal('cookieConsent', 1, locale)()) as CookieConsentGlobal

  if (!data?.enabled) {
    return null
  }

  return (
    <CookieBanner
      acceptLabel={data.acceptLabel ?? 'Accept all'}
      content={data.content ?? null}
      enabled={Boolean(data.enabled)}
      expiryDays={data.expiryDays ?? 365}
      policyLink={data.policyLink ?? null}
      rejectLabel={data.rejectLabel}
      showCloseButton={data.showCloseButton ?? true}
      storageKey={data.storageKey ?? 'horizon-cookie-consent'}
      title={data.title}
    />
  )
}
