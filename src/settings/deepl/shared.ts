import { defaultLocale, localeCodes, type Locale } from '@/i18n/locales'
import type { DeeplSetting } from '@/payload-types'

export type ResolvedDeepLSettings = {
  enabled: boolean
  apiUrl: string
  apiKey: string
  sourceLanguage: Locale
}

export const EMPTY_DEEPL_SETTINGS: ResolvedDeepLSettings = {
  enabled: false,
  apiUrl: 'https://api.deepl.com',
  apiKey: '',
  sourceLanguage: defaultLocale,
}

function pickString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

export function resolveDeepLSourceLanguage(value: unknown): Locale {
  const code = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (localeCodes.includes(code as Locale)) return code as Locale
  return defaultLocale
}

export function resolveDeepLSettingsFromGlobal(
  doc: DeeplSetting | null | undefined,
): ResolvedDeepLSettings {
  const sourceLanguage = resolveDeepLSourceLanguage(doc?.sourceLanguage)

  if (!doc || doc.enabled !== true) {
    return {
      enabled: false,
      apiUrl: pickString(doc?.apiUrl, EMPTY_DEEPL_SETTINGS.apiUrl),
      apiKey: '',
      sourceLanguage,
    }
  }

  return {
    enabled: true,
    apiUrl: pickString(doc.apiUrl, EMPTY_DEEPL_SETTINGS.apiUrl),
    apiKey: pickString(doc.apiKey, EMPTY_DEEPL_SETTINGS.apiKey),
    sourceLanguage,
  }
}
