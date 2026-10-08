import type { Payload } from 'payload'

import { localeCodes, type Locale } from '@/i18n/locales'
import type { Page, Post } from '@/payload-types'
import { getDeepLSettingsFromPayload } from '@/settings/deepl/server'
import { resolveDeepLSourceLanguage } from '@/settings/deepl/shared'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'
import { seedMissingTranslationLocales } from '@/utilities/seedMissingTranslationLocales'

import { layoutHasTranslatableBlocks } from './blockRegistry'
import { COOKIE_CONSENT_FIELD_REGISTRY } from './cookieConsentFieldRegistry'
import { documentHasSourceTranslatableContent } from './documentTranslate'
import { FOOTER_FIELD_REGISTRY } from './footerFieldRegistry'
import { HEADER_FIELD_REGISTRY } from './headerFieldRegistry'
import { LOCALIZATION_FIELD_REGISTRY } from './localizationFieldRegistry'
import { PROPERTY_FILTERS_FIELD_REGISTRY } from './propertyFiltersFieldRegistry'
import { PROPERTY_MAP_FIELD_REGISTRY } from './propertyMapFieldRegistry'
import { POST_FIELD_REGISTRY } from './postFieldRegistry'
import { autoTranslateGlobal } from './translateGlobal'
import { autoTranslatePageLayout } from './translatePage'
import { autoTranslatePost } from './translatePost'

const PAGE_SIZE = 25

type SyncSiteContentForLocalesArgs = {
  payload: Payload
  targetLocales: Locale[]
  sourceLocale?: string
}

async function revalidateGlobalTags(slug: string): Promise<void> {
  await revalidateCacheTag(`global_${slug}`)
  for (const locale of localeCodes) {
    await revalidateCacheTag(`global_${slug}_${locale}`)
  }
}

async function syncGlobal(
  payload: Payload,
  slug:
    | 'footer'
    | 'header'
    | 'cookieConsent'
    | 'propertyMap'
    | 'propertyFilters'
    | 'localization',
  registry: {
    strings: readonly string[]
    richText: readonly string[]
  },
  targetLocales: Locale[],
  sourceLocale: Locale,
): Promise<void> {
  let sourceDoc: Record<string, unknown>

  try {
    sourceDoc = (await payload.findGlobal({
      slug,
      locale: sourceLocale,
      fallbackLocale: false,
      depth: 0,
      overrideAccess: true,
    })) as unknown as Record<string, unknown>
  } catch (error) {
    payload.logger.warn({
      err: error,
      msg: `[autoTranslate] Localization sync: failed to load global "${slug}"`,
    })
    return
  }

  if (!documentHasSourceTranslatableContent(sourceDoc, registry)) return

  // previousDoc === sourceDoc → empty-only fill (preserve manual edits)
  const { updatedLocales } = await autoTranslateGlobal({
    payload,
    slug,
    registry,
    sourceDoc,
    previousDoc: sourceDoc,
    skipChangeCheck: true,
    sourceLocale,
    targetLocales,
  })

  if (updatedLocales.length > 0) {
    try {
      await revalidateGlobalTags(slug)
    } catch (error) {
      payload.logger.warn({
        err: error,
        msg: `[autoTranslate] Localization sync: revalidation failed for "${slug}"`,
      })
    }
  }
}

async function syncPages(
  payload: Payload,
  targetLocales: Locale[],
  sourceLocale: Locale,
): Promise<void> {
  let page = 1
  let hasNext = true

  while (hasNext) {
    const result = await payload.find({
      collection: 'pages',
      limit: PAGE_SIZE,
      page,
      depth: 0,
      locale: sourceLocale,
      fallbackLocale: false,
      draft: true,
      overrideAccess: true,
    })

    for (const doc of result.docs) {
      if (!doc.layout?.length || !layoutHasTranslatableBlocks(doc.layout)) continue

      try {
        await autoTranslatePageLayout({
          payload,
          pageId: doc.id,
          sourceDoc: doc as Page,
          previousDoc: doc as Page,
          skipChangeCheck: true,
          sourceLocale,
          isDraft: doc._status !== 'published',
          targetLocales,
        })
      } catch (error) {
        payload.logger.error({
          err: error,
          msg: `[autoTranslate] Localization sync: page ${doc.id} failed`,
        })
      }
    }

    hasNext = result.hasNextPage
    page += 1
  }
}

async function syncPosts(
  payload: Payload,
  targetLocales: Locale[],
  sourceLocale: Locale,
): Promise<void> {
  let page = 1
  let hasNext = true

  while (hasNext) {
    const result = await payload.find({
      collection: 'posts',
      limit: PAGE_SIZE,
      page,
      depth: 0,
      locale: sourceLocale,
      fallbackLocale: false,
      draft: true,
      overrideAccess: true,
    })

    for (const doc of result.docs) {
      if (
        !documentHasSourceTranslatableContent(
          doc as unknown as Record<string, unknown>,
          POST_FIELD_REGISTRY,
        )
      ) {
        continue
      }

      try {
        await autoTranslatePost({
          payload,
          postId: doc.id,
          sourceDoc: doc as Post,
          previousDoc: doc as Post,
          skipChangeCheck: true,
          sourceLocale,
          isDraft: doc._status !== 'published',
          targetLocales,
        })
      } catch (error) {
        payload.logger.error({
          err: error,
          msg: `[autoTranslate] Localization sync: post ${doc.id} failed`,
        })
      }
    }

    hasNext = result.hasNextPage
    page += 1
  }
}

/**
 * Backfill DeepL translations for newly enabled site locales across all
 * covered CMS content. Fills empty/missing fields only (does not overwrite
 * existing target-locale text).
 */
export async function syncSiteContentForLocales({
  payload,
  targetLocales,
  sourceLocale,
}: SyncSiteContentForLocalesArgs): Promise<void> {
  const deepl = await getDeepLSettingsFromPayload(payload)
  const normalizedSource = resolveDeepLSourceLanguage(sourceLocale ?? deepl.sourceLanguage)

  const locales = targetLocales
    .map((code) => String(code).trim().toLowerCase())
    .filter((code): code is Locale => localeCodes.includes(code as Locale))
    .filter((code) => code !== normalizedSource)

  if (locales.length === 0) return

  if (!deepl.enabled || !deepl.apiKey.trim()) {
    payload.logger.info(
      `[autoTranslate] Localization sync skipped — DeepL disabled (locales: ${locales.join(', ')})`,
    )
    return
  }

  payload.logger.info(
    `[autoTranslate] Localization sync starting for locales: ${locales.join(', ')}`,
  )

  const globals: Array<{
    slug:
      | 'footer'
      | 'header'
      | 'cookieConsent'
      | 'propertyMap'
      | 'propertyFilters'
      | 'localization'
    registry: { strings: readonly string[]; richText: readonly string[] }
  }> = [
    { slug: 'localization', registry: LOCALIZATION_FIELD_REGISTRY },
    { slug: 'footer', registry: FOOTER_FIELD_REGISTRY },
    { slug: 'header', registry: HEADER_FIELD_REGISTRY },
    { slug: 'cookieConsent', registry: COOKIE_CONSENT_FIELD_REGISTRY },
    { slug: 'propertyMap', registry: PROPERTY_MAP_FIELD_REGISTRY },
    { slug: 'propertyFilters', registry: PROPERTY_FILTERS_FIELD_REGISTRY },
  ]

  for (const { slug, registry } of globals) {
    try {
      await syncGlobal(payload, slug, registry, locales, normalizedSource)
    } catch (error) {
      payload.logger.error({
        err: error,
        msg: `[autoTranslate] Localization sync: global "${slug}" failed`,
      })
    }
  }

  try {
    await syncPages(payload, locales, normalizedSource)
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: '[autoTranslate] Localization sync: pages failed',
    })
  }

  try {
    await syncPosts(payload, locales, normalizedSource)
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: '[autoTranslate] Localization sync: posts failed',
    })
  }

  try {
    await seedMissingTranslationLocales(payload, locales)
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: '[autoTranslate] Localization sync: Translations collection failed',
    })
  }

  payload.logger.info(
    `[autoTranslate] Localization sync finished for locales: ${locales.join(', ')}`,
  )
}
