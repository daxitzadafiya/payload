import type { GlobalAfterChangeHook } from 'payload'

import { localeCodes, type Locale } from '@/i18n/locales'
import { enqueueAutoTranslate } from '@/utilities/autoTranslate/autoTranslateQueue'
import { syncSiteContentForLocales } from '@/utilities/autoTranslate/syncSiteContentForLocales'
import { getDeepLSettingsFromPayload } from '@/settings/deepl/server'

type LanguageRow = {
  locale?: string | null
  enabled?: boolean | null
}

function enabledLocaleSet(languages: LanguageRow[] | null | undefined): Set<Locale> {
  const set = new Set<Locale>()
  if (!Array.isArray(languages)) return set

  for (const row of languages) {
    if (row?.enabled === false) continue
    const code = String(row?.locale ?? '')
      .trim()
      .toLowerCase()
    if (localeCodes.includes(code as Locale)) {
      set.add(code as Locale)
    }
  }

  return set
}

/**
 * When Site languages are newly enabled, enqueue a DeepL backfill for all
 * localized CMS content into those locales (empty fields only), including
 * Localization Display names shown in the header language switcher.
 */
export const syncContentOnLanguageChange: GlobalAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const current = enabledLocaleSet(
    (doc as { languages?: LanguageRow[] | null })?.languages,
  )
  const previous = enabledLocaleSet(
    (previousDoc as { languages?: LanguageRow[] | null } | null | undefined)?.languages,
  )

  const addedLocales = [...current].filter((code) => !previous.has(code))

  if (addedLocales.length === 0) return doc

  const deepl = await getDeepLSettingsFromPayload(req.payload)
  if (!deepl.enabled || !deepl.apiKey.trim()) {
    req.payload.logger.info(
      `[autoTranslate] Languages added (${addedLocales.join(', ')}) but DeepL is disabled — content sync skipped. Enable DeepL and re-save Localization (or re-enable the language) to backfill.`,
    )
    return doc
  }

  req.payload.logger.info(
    `[autoTranslate] Languages added/re-enabled: ${addedLocales.join(', ')} — enqueueing site content sync`,
  )

  queueMicrotask(() => {
    void enqueueAutoTranslate(() =>
      syncSiteContentForLocales({
        payload: req.payload,
        targetLocales: addedLocales,
      }),
    ).catch((error) => {
      req.payload.logger.error({
        err: error,
        msg: '[autoTranslate] Localization language sync failed',
      })
    })
  })

  return doc
}
