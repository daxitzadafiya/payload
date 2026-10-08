import type { Config } from '@/payload-types'
import type { Payload } from 'payload'

import { getSiteContentLocales } from '@/i18n/getSiteContentLocales'
import { defaultLocale, type Locale } from '@/i18n/locales'
import { getDeepLSettingsFromPayload } from '@/settings/deepl/server'
import { translateWithDeepL } from '@/utilities/deepl'

import { AUTO_TRANSLATING_CONTEXT_KEY, FORCE_TRANSLATE_TARGET_LOCALE_KEY } from './context'
import {
  buildDocumentPatches,
  buildUpdateDataFromPatches,
  documentHasTranslatableFields,
  documentLocalizedFieldsChanged,
  type DocumentFieldRegistry,
} from './documentTranslate'
import { resolveTargetLocales } from './resolveTargetLocales'

type GlobalSlug = keyof Config['globals']

type AutoTranslateGlobalArgs = {
  payload: Payload
  slug: GlobalSlug
  registry: DocumentFieldRegistry
  sourceDoc: Record<string, unknown>
  previousDoc?: Record<string, unknown> | null
  skipChangeCheck?: boolean
  sourceLocale?: string
  /** When set, only translate these locales (intersected with enabled site locales). */
  targetLocales?: readonly Locale[]
}

export async function autoTranslateGlobal({
  payload,
  slug,
  registry,
  sourceDoc,
  previousDoc,
  skipChangeCheck = false,
  sourceLocale = defaultLocale,
  targetLocales: targetLocalesFilter,
}: AutoTranslateGlobalArgs): Promise<{ updatedLocales: string[] }> {
  const normalizedSource = sourceLocale.trim().toLowerCase() || defaultLocale

  if (!documentHasTranslatableFields(registry)) {
    return { updatedLocales: [] }
  }

  if (
    !skipChangeCheck &&
    previousDoc &&
    !documentLocalizedFieldsChanged(sourceDoc, previousDoc, registry)
  ) {
    return { updatedLocales: [] }
  }

  const deepl = await getDeepLSettingsFromPayload(payload)
  if (!deepl.enabled || !deepl.apiKey.trim()) {
    payload.logger.info(`[autoTranslate] DeepL disabled — skipping ${slug} translation`)
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
    let targetDoc: Record<string, unknown> | null = null

    try {
      targetDoc = (await payload.findGlobal({
        slug,
        locale: targetLocale,
        fallbackLocale: false,
        depth: 0,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>
    } catch {
      targetDoc = null
    }

    const { patches, hasChanges } = await buildDocumentPatches(
      sourceDoc,
      previousDoc,
      targetDoc,
      registry,
      translate,
      targetLocale,
    )

    // Identity-only patches must not call updateGlobal — that bumps updatedAt and
    // triggers Payload's admin "Document modified" stale-data modal.
    if (!hasChanges) continue

    const data = buildUpdateDataFromPatches(patches, {
      baseDoc: sourceDoc,
      targetDoc,
      previousSourceDoc: previousDoc,
    })
    if (!data) continue

    await payload.updateGlobal({
      slug,
      locale: targetLocale,
      fallbackLocale: false,
      depth: 0,
      data,
      context: {
        [AUTO_TRANSLATING_CONTEXT_KEY]: true,
        [FORCE_TRANSLATE_TARGET_LOCALE_KEY]: targetLocale,
        disableRevalidate: true,
        skipAutoTranslate: true,
      },
      overrideAccess: true,
    })

    updatedLocales.push(targetLocale)
  }

  if (updatedLocales.length > 0) {
    payload.logger.info(
      `[autoTranslate] Global "${slug}" translated: ${updatedLocales.join(', ')}`,
    )
  }

  return { updatedLocales }
}
