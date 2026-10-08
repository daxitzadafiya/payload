import type { Language } from '@payloadcms/translations'
import type { Payload } from 'payload'

import {
  adminLanguagePacks,
  isAdminLanguageCode,
  withLanguageLabel,
  type AdminLanguageCode,
} from '@/i18n/adminLanguagePacks'
import { defaultLocale } from '@/i18n/locales'

export type LocalizationLanguageRow = {
  enabled?: boolean | null
  locale?: string | null
  label?: string | Record<string, string> | null
}

export function isLabelRecord(label: unknown): label is Record<string, string> {
  return Boolean(label) && typeof label === 'object' && !Array.isArray(label)
}

/** Pick Display name for a UI language from a locale:'all' (or string) label. */
export function resolveDisplayNameLabel(
  label: string | Record<string, string> | null | undefined,
  uiLanguage: string,
): string | null {
  if (!label) return null

  if (isLabelRecord(label)) {
    const preferred = label[uiLanguage]?.trim()
    if (preferred) return preferred
    const english = label.en?.trim()
    if (english) return english
    const first = Object.values(label).find((value) => typeof value === 'string' && value.trim())
    return first?.trim() || null
  }

  if (typeof label === 'string' && label.trim()) return label.trim()
  return null
}

/**
 * Keep Account → Language options in sync with Globals → Localization:
 * - add packs for enabled site languages that have a Payload UI pack
 * - remove packs that are no longer enabled (always keeps `en`)
 * - set option labels from Display names for the current admin UI language
 */
export function applyAccountLanguageOptionLabels(
  payload: Payload,
  rows: LocalizationLanguageRow[],
  uiLanguage: string,
): void {
  const lang = uiLanguage.trim().toLowerCase() || defaultLocale
  const next: Partial<Record<AdminLanguageCode, Language>> = {}

  for (const row of rows) {
    const code = String(row.locale ?? '')
      .trim()
      .toLowerCase()
    if (!code || !isAdminLanguageCode(code)) continue

    const pack = adminLanguagePacks[code]
    const displayName = resolveDisplayNameLabel(row.label, lang)
    next[code] = displayName ? withLanguageLabel(pack, displayName) : pack
  }

  // Always keep English so the admin UI can fall back
  if (!next.en) {
    next.en = adminLanguagePacks.en
  }

  const replacement: Record<string, Language> = {}
  for (const code of Object.keys(next) as AdminLanguageCode[]) {
    const pack = next[code]
    if (pack) replacement[code] = pack
  }

  let applied = false
  try {
    payload.config.i18n.supportedLanguages =
      replacement as typeof payload.config.i18n.supportedLanguages
    applied = true
  } catch {
    // fall through to in-place mutation
  }

  if (!applied) {
    const supported = payload.config.i18n.supportedLanguages as Record<string, Language | undefined>
    const desired = new Set(Object.keys(replacement))
    for (const key of Object.keys(supported)) {
      if (!desired.has(key)) {
        try {
          delete supported[key]
        } catch {
          supported[key] = undefined
        }
      }
    }
    for (const code of desired) {
      supported[code] = replacement[code]
    }
  }
}
