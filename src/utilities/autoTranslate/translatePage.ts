import type { Payload } from 'payload'

import { getSiteContentLocales } from '@/i18n/getSiteContentLocales'
import { defaultLocale, type Locale } from '@/i18n/locales'
import type { Page } from '@/payload-types'
import { getDeepLSettingsFromPayload } from '@/settings/deepl/server'
import { translateWithDeepL } from '@/utilities/deepl'

import { layoutHasTranslatableBlocks } from './blockRegistry'
import { AUTO_TRANSLATING_CONTEXT_KEY, FORCE_TRANSLATE_TARGET_LOCALE_KEY } from './context'
import {
  applyLayoutPatches,
  buildLayoutPatches,
  layoutLocalizedFieldsChanged,
} from './layoutTranslate'
import { resolveTargetLocales } from './resolveTargetLocales'

type AutoTranslatePageLayoutArgs = {
  payload: Payload
  pageId: number | string
  sourceDoc: Page
  previousDoc?: Page | null
  /** When true, translate without comparing to previousDoc (deferred jobs). */
  skipChangeCheck?: boolean
  sourceLocale?: string
  isDraft: boolean
  /** When set, only translate these locales (intersected with enabled site locales). */
  targetLocales?: readonly Locale[]
}

export async function autoTranslatePageLayout({
  payload,
  pageId,
  sourceDoc,
  previousDoc,
  skipChangeCheck = false,
  sourceLocale = defaultLocale,
  isDraft,
  targetLocales: targetLocalesFilter,
}: AutoTranslatePageLayoutArgs): Promise<{ updatedLocales: string[] }> {
  const normalizedSource = sourceLocale.trim().toLowerCase() || defaultLocale
  const sourceLayout = sourceDoc.layout

  if (!layoutHasTranslatableBlocks(sourceLayout)) {
    return { updatedLocales: [] }
  }

  if (
    !skipChangeCheck &&
    previousDoc &&
    !layoutLocalizedFieldsChanged(sourceLayout, previousDoc.layout)
  ) {
    return { updatedLocales: [] }
  }

  const deepl = await getDeepLSettingsFromPayload(payload)
  if (!deepl.enabled || !deepl.apiKey.trim()) {
    payload.logger.info('[autoTranslate] DeepL disabled — skipping page layout translation')
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

  for (const targetLocale of targetLocales) {
    let targetDoc: Page | null = null

    try {
      targetDoc = await payload.findByID({
        collection: 'pages',
        id: pageId,
        locale: targetLocale,
        fallbackLocale: false,
        draft: isDraft,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      targetDoc = null
    }

    // Target layout is only for "already translated?" checks. Always apply patches
    // onto a clone of the English/source layout so required non-localized fields and
    // block shape stay intact (sparse target locales used to wipe required strings).
    const targetLayout = targetDoc?.layout ?? null
    const patches = await buildLayoutPatches(
      sourceLayout,
      previousDoc?.layout,
      targetLayout,
      translate,
      targetLocale,
    )
    const patchedLayout = applyLayoutPatches(sourceLayout, patches)

    if (!patchedLayout) continue

    await payload.update({
      collection: 'pages',
      id: pageId,
      locale: targetLocale,
      fallbackLocale: false,
      draft: isDraft,
      depth: 0,
      data: {
        layout: patchedLayout,
      },
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
      `[autoTranslate] Page layout translated for page ${pageId}: ${updatedLocales.join(', ')}`,
    )
  }

  return { updatedLocales }
}
