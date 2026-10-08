import type { Payload } from 'payload'

import { defaultLocale } from '@/i18n/locales'
import { getDeepLSettingsFromPayload } from '@/settings/deepl/server'

/**
 * Auto-translate only runs when the admin saves in the DeepL source language
 * (Settings → DeepL). Falls back to English when the setting is unset.
 */
export async function resolveAutoTranslateSourceLocale(
  payload: Payload,
  requestLocale: unknown,
): Promise<{ sourceLocale: string; shouldTranslate: boolean }> {
  const { sourceLanguage } = await getDeepLSettingsFromPayload(payload)
  const requested = typeof requestLocale === 'string' ? requestLocale : ''
  const sourceLocale = requested.trim().toLowerCase() || defaultLocale
  return {
    sourceLocale,
    shouldTranslate: sourceLocale === sourceLanguage,
  }
}

