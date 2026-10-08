import type { Payload } from 'payload'

import {
  parseTranslationMap,
  type TranslationMap,
} from '@/collections/Translations/parseTranslationMap'
import { defaultLocale } from '@/i18n/locales'
import { getDeepLSettingsFromPayload } from '@/settings/deepl/server'
import { translateManyWithDeepL } from '@/utilities/deepl'

const COLLECTION_SLUG = 'translations' as const
const PAGE_SIZE = 100
const UPSERT_BATCH = 40

/**
 * DeepL-fill missing locale entries on every Translations collection key
 * for the given target locales (source = English). Batches DeepL requests
 * and DB writes.
 */
export async function seedMissingTranslationLocales(
  payload: Payload,
  targetLocales: string[],
): Promise<{ updatedKeys: number }> {
  const locales = targetLocales
    .map((code) => code.trim().toLowerCase())
    .filter((code) => code && code !== defaultLocale)

  if (locales.length === 0) return { updatedKeys: 0 }

  const deepl = await getDeepLSettingsFromPayload(payload)
  if (!deepl.enabled || !deepl.apiKey.trim()) {
    payload.logger.info(
      '[translations] DeepL disabled — skipping Translations collection backfill',
    )
    return { updatedKeys: 0 }
  }

  type Row = { id: number | string; key: string; map: TranslationMap }
  const rows: Row[] = []

  let page = 1
  let hasNext = true
  while (hasNext) {
    const result = await payload.find({
      collection: COLLECTION_SLUG,
      limit: PAGE_SIZE,
      page,
      depth: 0,
      overrideAccess: true,
    })

    for (const doc of result.docs) {
      const key = typeof doc.key === 'string' ? doc.key : ''
      if (!key) continue
      rows.push({
        id: doc.id,
        key,
        map: { ...parseTranslationMap(doc.translations) },
      })
    }

    hasNext = result.hasNextPage
    page += 1
  }

  let updatedKeys = 0
  const dirty = new Map<string | number, TranslationMap>()

  for (const lang of locales) {
    const pending: Array<{ id: number | string; source: string }> = []

    for (const row of rows) {
      const sourceText = row.map[defaultLocale]
      if (!sourceText?.trim()) continue
      if (row.map[lang]?.trim()) continue
      pending.push({ id: row.id, source: sourceText })
    }

    if (pending.length === 0) continue

    payload.logger.info(
      `[translations] Batch-translating ${pending.length} keys → ${lang}`,
    )

    const results = await translateManyWithDeepL(
      pending.map((row) => row.source),
      lang,
      defaultLocale,
      deepl,
    )

    for (let i = 0; i < pending.length; i += 1) {
      const text = results[i]
      if (!text) continue

      const item = pending[i]!
      const row = rows.find((r) => r.id === item.id)
      if (!row) continue

      row.map[lang] = text
      dirty.set(row.id, row.map)
      updatedKeys += 1
    }
  }

  const dirtyEntries = Array.from(dirty.entries())
  for (let offset = 0; offset < dirtyEntries.length; offset += UPSERT_BATCH) {
    const slice = dirtyEntries.slice(offset, offset + UPSERT_BATCH)
    await Promise.all(
      slice.map(([id, translations]) =>
        payload.update({
          collection: COLLECTION_SLUG,
          id,
          data: { translations },
          overrideAccess: true,
        }),
      ),
    )
  }

  if (updatedKeys > 0) {
    payload.logger.info(
      `[translations] Backfilled ${updatedKeys} missing locale string(s) for ${locales.join(', ')}`,
    )
  }

  return { updatedKeys }
}
