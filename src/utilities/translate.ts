import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'

import {
  parseTranslationMap,
  type TranslationMap,
} from '@/collections/Translations/parseTranslationMap'
import { translateWithDeepL } from '@/utilities/deepl'

const COLLECTION_SLUG = 'translations' as const

export type { TranslationMap } from '@/collections/Translations/parseTranslationMap'
export { parseTranslationMap }

async function findByKey(payload: Payload, key: string) {
  const { docs } = await payload.find({
    collection: COLLECTION_SLUG,
    where: { key: { equals: key } },
    limit: 1,
    depth: 0,
  })

  return docs[0] ?? null
}

async function upsert(
  payload: Payload,
  key: string,
  translations: TranslationMap,
) {
  const record = await findByKey(payload, key)

  if (!record) {
    await payload.create({
      collection: COLLECTION_SLUG,
      data: { key, translations },
      overrideAccess: true,
    })
    return
  }

  await payload.update({
    collection: COLLECTION_SLUG,
    id: record.id,
    data: {
      translations: {
        ...parseTranslationMap(record.translations),
        ...translations,
      },
    },
    overrideAccess: true,
  })
}

/**
 * Database-first translation:
 * - return stored text when the language exists
 * - otherwise translate via DeepL, save, and return
 * - never stores the English fallback as a failed translation
 */
export async function t(
  key: string,
  language: string,
  fallbackValue: string,
  payload?: Payload,
): Promise<string> {
  const db = payload ?? (await getPayload({ config: configPromise }))
  const lang = language.trim().toLowerCase() || 'en'

  const record = await findByKey(db, key)
  const stored = record ? parseTranslationMap(record.translations) : {}

  if (stored[lang]) return stored[lang]

  if (lang === 'en') {
    const english = stored.en ?? fallbackValue
    if (!stored.en) {
      await upsert(db, key, { en: english })
    }
    return english
  }

  const sourceText = stored.en ?? fallbackValue
  if (!stored.en) {
    await upsert(db, key, { en: sourceText })
  }

  const translated = await translateWithDeepL(sourceText, lang, 'en')
  if (!translated) return fallbackValue

  await upsert(db, key, {
    en: stored.en ?? sourceText,
    [lang]: translated,
  })

  return translated
}
