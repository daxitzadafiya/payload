import type { Payload } from 'payload'

import {
  adminLanguagePacks,
  isAdminLanguageCode,
  withLanguageLabel,
  type AdminLanguageCode,
} from '@/i18n/adminLanguagePacks'
import {
  applyAccountLanguageOptionLabels,
  resolveDisplayNameLabel,
  type LocalizationLanguageRow,
} from '@/i18n/adminLanguageLabels'
import { defaultLocale, getCmsLocaleLabel } from '@/i18n/locales'

/**
 * Drive Account → Language options from Globals → Localization
 * (enabled site languages that also have a Payload admin UI pack).
 * Returns the codes applied to `i18n.supportedLanguages` (always includes `en`).
 *
 * Option labels use Localization Display names (English on sync; each admin
 * request refreshes them for the current Account language via filterAdminLocales).
 */
export async function syncAdminLanguagesFromLocalization(
  payload: Payload,
): Promise<AdminLanguageCode[]> {
  let rows: LocalizationLanguageRow[] = []

  try {
    const localization = await payload.findGlobal({
      slug: 'localization',
      depth: 0,
      locale: 'all',
      overrideAccess: true,
    })
    rows = (localization?.languages ?? []).filter(
      (row): boolean => Boolean(row?.locale) && row.enabled !== false,
    ) as LocalizationLanguageRow[]
  } catch (error) {
    payload.logger.warn(
      { err: error },
      '[adminLanguages] Could not read Localization global; keeping current Language options',
    )
    return readAppliedAdminLanguageCodes(payload)
  }

  const next: Partial<Record<AdminLanguageCode, (typeof adminLanguagePacks)[AdminLanguageCode]>> =
    {}

  for (const row of rows) {
    const code = String(row.locale).trim().toLowerCase()
    if (!isAdminLanguageCode(code)) {
      payload.logger.info(
        `[adminLanguages] Skipping "${code}" for Account Language — no Payload UI pack (content Locale still works)`,
      )
      continue
    }

    const pack = adminLanguagePacks[code]
    const label =
      resolveDisplayNameLabel(row.label, defaultLocale) || getCmsLocaleLabel(code)
    next[code] = withLanguageLabel(pack, label)
  }

  // Always keep English so the admin UI can fall back
  if (!next.en) {
    next.en = adminLanguagePacks.en
  }

  // If Localization is empty, fall back to English + default locale pack when available
  if (Object.keys(next).length <= 1 && defaultLocale !== 'en' && isAdminLanguageCode(defaultLocale)) {
    next[defaultLocale] = adminLanguagePacks[defaultLocale]
  }

  const supported = payload.config.i18n.supportedLanguages as Record<string, unknown>
  const desiredCodes = new Set(Object.keys(next))

  // Prefer a fresh object so sealed/frozen configs still pick up the filtered list.
  const replacement: Record<string, unknown> = {}
  for (const code of desiredCodes) {
    replacement[code] = next[code as AdminLanguageCode]
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
    for (const key of Object.keys(supported)) {
      if (!desiredCodes.has(key)) {
        try {
          delete supported[key]
        } catch {
          supported[key] = undefined
        }
      }
    }
    for (const code of desiredCodes) {
      supported[code] = next[code as AdminLanguageCode]
    }
  }

  applyAccountLanguageOptionLabels(payload, rows, defaultLocale)

  const codes = readAppliedAdminLanguageCodes(payload)
  payload.logger.info(
    `[adminLanguages] Account Language options synced from Localization: ${codes.join(', ')}`,
  )
  return codes
}

function readAppliedAdminLanguageCodes(payload: Payload): AdminLanguageCode[] {
  const supported = payload.config.i18n.supportedLanguages as Record<string, unknown>
  return Object.keys(supported)
    .filter((key) => supported[key] && isAdminLanguageCode(key))
    .sort((a, b) => a.localeCompare(b)) as AdminLanguageCode[]
}
