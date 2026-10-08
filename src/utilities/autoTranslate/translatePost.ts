import type { Payload } from 'payload'

import { getSiteContentLocales } from '@/i18n/getSiteContentLocales'
import { defaultLocale, type Locale } from '@/i18n/locales'
import type { Post } from '@/payload-types'
import { getDeepLSettingsFromPayload } from '@/settings/deepl/server'
import { translateWithDeepL } from '@/utilities/deepl'

import { AUTO_TRANSLATING_CONTEXT_KEY, FORCE_TRANSLATE_TARGET_LOCALE_KEY } from './context'
import {
  buildDocumentPatches,
  buildUpdateDataFromPatches,
  documentHasTranslatableFields,
  documentLocalizedFieldsChanged,
} from './documentTranslate'
import { POST_FIELD_REGISTRY } from './postFieldRegistry'
import { resolveTargetLocales } from './resolveTargetLocales'

type AutoTranslatePostArgs = {
  payload: Payload
  postId: number | string
  sourceDoc: Post
  previousDoc?: Post | null
  skipChangeCheck?: boolean
  sourceLocale?: string
  isDraft: boolean
  /** When set, only translate these locales (intersected with enabled site locales). */
  targetLocales?: readonly Locale[]
}

export async function autoTranslatePost({
  payload,
  postId,
  sourceDoc,
  previousDoc,
  skipChangeCheck = false,
  sourceLocale = defaultLocale,
  isDraft,
  targetLocales: targetLocalesFilter,
}: AutoTranslatePostArgs): Promise<{ updatedLocales: string[] }> {
  const normalizedSource = sourceLocale.trim().toLowerCase() || defaultLocale
  const registry = POST_FIELD_REGISTRY

  if (!documentHasTranslatableFields(registry)) {
    return { updatedLocales: [] }
  }

  if (
    !skipChangeCheck &&
    previousDoc &&
    !documentLocalizedFieldsChanged(
      sourceDoc as unknown as Record<string, unknown>,
      previousDoc as unknown as Record<string, unknown> | null,
      registry,
    )
  ) {
    return { updatedLocales: [] }
  }

  const deepl = await getDeepLSettingsFromPayload(payload)
  if (!deepl.enabled || !deepl.apiKey.trim()) {
    payload.logger.info('[autoTranslate] DeepL disabled — skipping post translation')
    return { updatedLocales: [] }
  }

  const locales = await getSiteContentLocales(payload)
  const targetLocales = resolveTargetLocales(locales, normalizedSource, targetLocalesFilter)

  if (targetLocales.length === 0) {
    return { updatedLocales: [] }
  }

  const translate = (text: string, targetLocale: string) =>
    translateWithDeepL(text, targetLocale, normalizedSource, deepl)

  const updatedLocales: string[] = []
  const sourceRecord = sourceDoc as unknown as Record<string, unknown>

  for (const targetLocale of targetLocales) {
    let targetDoc: Post | null = null

    try {
      targetDoc = await payload.findByID({
        collection: 'posts',
        id: postId,
        locale: targetLocale,
        fallbackLocale: false,
        draft: isDraft,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      targetDoc = null
    }

    const { patches, hasChanges } = await buildDocumentPatches(
      sourceRecord,
      previousDoc as unknown as Record<string, unknown> | null,
      targetDoc as unknown as Record<string, unknown> | null,
      registry,
      translate,
      targetLocale,
    )

    if (!hasChanges) continue

    const data = buildUpdateDataFromPatches(patches, {
      baseDoc: sourceRecord,
      targetDoc: targetDoc as unknown as Record<string, unknown> | null,
      previousSourceDoc: previousDoc as unknown as Record<string, unknown> | null,
    })
    if (!data) continue

    await payload.update({
      collection: 'posts',
      id: postId,
      locale: targetLocale,
      fallbackLocale: false,
      draft: isDraft,
      depth: 0,
      data,
      context: {
        [AUTO_TRANSLATING_CONTEXT_KEY]: true,
        [FORCE_TRANSLATE_TARGET_LOCALE_KEY]: targetLocale,
        disableRevalidate: true,
      },
      overrideAccess: true,
    })

    updatedLocales.push(targetLocale)
  }

  if (updatedLocales.length > 0) {
    payload.logger.info(
      `[autoTranslate] Post translated for post ${postId}: ${updatedLocales.join(', ')}`,
    )
  }

  return { updatedLocales }
}
