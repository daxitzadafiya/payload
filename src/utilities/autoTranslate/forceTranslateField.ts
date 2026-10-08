import type { Payload } from 'payload'

import { getSiteContentLocales } from '@/i18n/getSiteContentLocales'
import { getCmsLocaleLabel, localeCodes, type Locale } from '@/i18n/locales'
import { getDeepLSettingsFromPayload } from '@/settings/deepl/server'
import { translateWithDeepL } from '@/utilities/deepl'

import {
  AUTO_TRANSLATING_CONTEXT_KEY,
  FORCE_TRANSLATE_TARGET_LOCALE_KEY,
} from './context'
import {
  buildDocumentPatches,
  buildUpdateDataFromPatches,
  type DocumentFieldRegistry,
} from './documentTranslate'
import { isLexicalRichText, lexicalPlainText, translateLexicalRichText } from './lexicalText'
import { POST_FIELD_REGISTRY } from './postFieldRegistry'
import { resolveTargetLocales } from './resolveTargetLocales'

export const FORCE_TRANSLATE_COLLECTIONS = ['pages', 'posts'] as const
export const FORCE_TRANSLATE_GLOBALS = [
  'header',
  'footer',
  'cookieConsent',
  'propertyMap',
  'propertyFilters',
  'localization',
] as const

export type ForceTranslateCollection = (typeof FORCE_TRANSLATE_COLLECTIONS)[number]
export type ForceTranslateGlobal = (typeof FORCE_TRANSLATE_GLOBALS)[number]

/** Collections that translate top-level localized fields (not layout blocks). */
const COLLECTION_FIELD_REGISTRIES: Partial<
  Record<ForceTranslateCollection, DocumentFieldRegistry>
> = {
  posts: POST_FIELD_REGISTRY,
}

export type ForceTranslateEntity =
  | { type: 'collection'; slug: ForceTranslateCollection; id: number | string; draft: boolean }
  | { type: 'global'; slug: ForceTranslateGlobal }

export type ForceTranslateResult = {
  succeeded: string[]
  failed: Array<{ locale: string; error: string }>
}

function isForceTranslateCollection(slug: string): slug is ForceTranslateCollection {
  return (FORCE_TRANSLATE_COLLECTIONS as readonly string[]).includes(slug)
}

function isForceTranslateGlobal(slug: string): slug is ForceTranslateGlobal {
  return (FORCE_TRANSLATE_GLOBALS as readonly string[]).includes(slug)
}

export function parsePayloadPath(path: string): string[] {
  return path
    .split('.')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
}

function isIndexSegment(segment: string): boolean {
  return /^\d+$/.test(segment)
}

function resolveArrayItem(array: unknown[], segment: string): unknown {
  if (isIndexSegment(segment)) {
    return array[Number(segment)]
  }

  return array.find(
    (item) =>
      item &&
      typeof item === 'object' &&
      String((item as { id?: unknown }).id ?? '') === segment,
  )
}

export function getAtPayloadPath(root: unknown, path: string): unknown {
  let current = root

  for (const segment of parsePayloadPath(path)) {
    if (current == null) return undefined

    if (Array.isArray(current)) {
      current = resolveArrayItem(current, segment)
      continue
    }

    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

function ensureArrayItem(
  array: unknown[],
  segment: string,
  sourceArray: unknown[] | undefined,
): Record<string, unknown> | null {
  const existing = resolveArrayItem(array, segment)
  if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
    return existing as Record<string, unknown>
  }

  const sourceItem = sourceArray ? resolveArrayItem(sourceArray, segment) : undefined
  const created: Record<string, unknown> =
    sourceItem && typeof sourceItem === 'object' && !Array.isArray(sourceItem)
      ? (structuredClone(sourceItem) as Record<string, unknown>)
      : {}

  if (isIndexSegment(segment)) {
    const index = Number(segment)
    while (array.length < index) array.push({})
    array[index] = created
  } else {
    if (created.id == null) created.id = segment
    array.push(created)
  }

  return created
}

export function buildUpdateAtPayloadPath(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> | null {
  const segments = parsePayloadPath(path)
  if (segments.length === 0) return null

  const top = segments[0]!
  const base = target[top] !== undefined ? target[top] : source[top]
  if (base === undefined) return null

  const cloned = structuredClone(base)
  const data: Record<string, unknown> = { [top]: cloned }

  let current: unknown = data
  let sourceCursor: unknown = source

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!
    const isLast = index === segments.length - 1

    if (Array.isArray(current)) {
      if (isLast) return null

      const sourceArray = Array.isArray(sourceCursor) ? sourceCursor : undefined
      const next = ensureArrayItem(current, segment, sourceArray)
      if (!next) return null
      current = next
      sourceCursor = sourceArray ? resolveArrayItem(sourceArray, segment) : undefined
      continue
    }

    if (!current || typeof current !== 'object') return null
    const record = current as Record<string, unknown>
    const sourceRecord =
      sourceCursor && typeof sourceCursor === 'object' && !Array.isArray(sourceCursor)
        ? (sourceCursor as Record<string, unknown>)
        : null

    if (isLast) {
      record[segment] = value
      return data
    }

    const existing = record[segment]
    const sourceNext = sourceRecord?.[segment]

    if (existing == null) {
      if (Array.isArray(sourceNext)) {
        record[segment] = structuredClone(sourceNext)
      } else if (sourceNext && typeof sourceNext === 'object') {
        record[segment] = structuredClone(sourceNext)
      } else {
        record[segment] = {}
      }
    }

    current = record[segment]
    sourceCursor = sourceNext
  }

  return data
}

function sourceHasContent(value: unknown): boolean {
  if (typeof value === 'string') return Boolean(value.trim())
  if (isLexicalRichText(value)) return Boolean(lexicalPlainText(value))
  return false
}

async function loadEntity(
  payload: Payload,
  entity: ForceTranslateEntity,
  locale: Locale,
): Promise<Record<string, unknown> | null> {
  try {
    if (entity.type === 'collection') {
      const doc = await payload.findByID({
        collection: entity.slug,
        id: entity.id,
        locale,
        fallbackLocale: false,
        draft: entity.draft,
        depth: 0,
        overrideAccess: true,
      })
      return doc as unknown as Record<string, unknown>
    }

    const doc = await payload.findGlobal({
      slug: entity.slug,
      locale,
      fallbackLocale: false,
      depth: 0,
      overrideAccess: true,
    })
    return doc as unknown as Record<string, unknown>
  } catch {
    return null
  }
}

async function writeEntity(
  payload: Payload,
  entity: ForceTranslateEntity,
  locale: Locale,
  data: Record<string, unknown>,
): Promise<void> {
  const context = {
    [AUTO_TRANSLATING_CONTEXT_KEY]: true,
    [FORCE_TRANSLATE_TARGET_LOCALE_KEY]: locale,
    disableRevalidate: true,
    skipAutoTranslate: true,
  }

  if (entity.type === 'collection') {
    await payload.update({
      collection: entity.slug,
      id: entity.id,
      locale,
      fallbackLocale: false,
      draft: entity.draft,
      depth: 0,
      data,
      context,
      overrideAccess: true,
    })
    return
  }

  await payload.updateGlobal({
    slug: entity.slug,
    locale,
    fallbackLocale: false,
    depth: 0,
    data,
    context,
    overrideAccess: true,
  })
}

export async function getForceTranslateMeta(payload: Payload): Promise<{
  enabled: boolean
  sourceLanguage: Locale
  targets: Array<{ code: Locale; label: string }>
}> {
  const deepl = await getDeepLSettingsFromPayload(payload)
  const siteLocales = await getSiteContentLocales(payload)
  const sourceLanguage = deepl.sourceLanguage
  const targets = resolveTargetLocales(siteLocales, sourceLanguage).map((code) => ({
    code,
    label: getCmsLocaleLabel(code),
  }))

  return {
    enabled: deepl.enabled && Boolean(deepl.apiKey.trim()),
    sourceLanguage,
    targets,
  }
}

export function parseForceTranslateEntity(body: {
  collection?: unknown
  global?: unknown
  id?: unknown
  draft?: unknown
}): ForceTranslateEntity {
  if (typeof body.global === 'string' && isForceTranslateGlobal(body.global)) {
    return { type: 'global', slug: body.global }
  }

  if (typeof body.collection === 'string' && isForceTranslateCollection(body.collection)) {
    if (typeof body.id !== 'string' && typeof body.id !== 'number') {
      throw new Error('Document id is required')
    }
    return {
      type: 'collection',
      slug: body.collection,
      id: body.id,
      draft: body.draft === true,
    }
  }

  throw new Error('Unsupported collection or global')
}

/**
 * Posts (and similar docs) have multiple required localized fields. Writing only
 * the force-translated path to an empty locale fails validation. Fill empty
 * siblings via empty-only patches, then overwrite the requested path.
 */
async function buildForceTranslateUpdateData(args: {
  entity: ForceTranslateEntity
  path: string
  translated: unknown
  sourceDoc: Record<string, unknown>
  targetDoc: Record<string, unknown>
  targetLocale: string
  translate: (text: string, targetLocale: string) => Promise<string | null>
}): Promise<Record<string, unknown> | null> {
  const registry =
    args.entity.type === 'collection'
      ? COLLECTION_FIELD_REGISTRIES[args.entity.slug]
      : undefined

  if (!registry) {
    return buildUpdateAtPayloadPath(
      args.targetDoc,
      args.sourceDoc,
      args.path,
      args.translated,
    )
  }

  const { patches } = await buildDocumentPatches(
    args.sourceDoc,
    args.sourceDoc,
    args.targetDoc,
    registry,
    args.translate,
    args.targetLocale,
  )

  if (typeof args.translated === 'string') {
    patches.set(args.path, { kind: 'string', value: args.translated })
  } else if (isLexicalRichText(args.translated)) {
    patches.set(args.path, {
      kind: 'richtext',
      value: args.translated as Record<string, unknown>,
    })
  } else {
    return null
  }

  return buildUpdateDataFromPatches(patches, {
    baseDoc: args.sourceDoc,
    targetDoc: args.targetDoc,
    previousSourceDoc: args.sourceDoc,
  })
}

export async function forceTranslateField(args: {
  payload: Payload
  entity: ForceTranslateEntity
  path: string
  target: string
}): Promise<ForceTranslateResult> {
  const path = args.path.trim()
  if (!path) throw new Error('Field path is required')

  const deepl = await getDeepLSettingsFromPayload(args.payload)
  if (!deepl.enabled || !deepl.apiKey.trim()) {
    throw new Error('DeepL is not enabled')
  }

  const siteLocales = await getSiteContentLocales(args.payload)
  const sourceLanguage = deepl.sourceLanguage
  const requested =
    args.target.trim().toLowerCase() === 'all'
      ? undefined
      : [args.target.trim().toLowerCase()]

  if (requested?.[0] && !localeCodes.includes(requested[0] as Locale)) {
    throw new Error(`Unsupported language: ${args.target}`)
  }

  const targets = resolveTargetLocales(siteLocales, sourceLanguage, requested)
  if (targets.length === 0) {
    throw new Error('No target languages available')
  }

  const sourceDoc = await loadEntity(args.payload, args.entity, sourceLanguage)
  if (!sourceDoc) throw new Error('Source document not found')

  const sourceValue = getAtPayloadPath(sourceDoc, path)
  if (!sourceHasContent(sourceValue)) {
    throw new Error('Source field is empty. Save content in the source language first.')
  }

  const translate = (text: string, targetLocale: string) =>
    translateWithDeepL(text, targetLocale, sourceLanguage, deepl)

  const succeeded: string[] = []
  const failed: Array<{ locale: string; error: string }> = []

  for (const targetLocale of targets) {
    try {
      let translated: unknown = null

      if (typeof sourceValue === 'string') {
        translated = await translate(sourceValue, targetLocale)
      } else if (isLexicalRichText(sourceValue)) {
        translated = await translateLexicalRichText(sourceValue, (text) =>
          translate(text, targetLocale),
        )
      }

      if (
        translated == null ||
        (typeof translated === 'string' && !translated.trim())
      ) {
        throw new Error('DeepL returned an empty translation')
      }

      const targetDoc = (await loadEntity(args.payload, args.entity, targetLocale)) ?? {}
      const data = await buildForceTranslateUpdateData({
        entity: args.entity,
        path,
        translated,
        sourceDoc,
        targetDoc,
        targetLocale,
        translate,
      })
      if (!data) throw new Error('Could not write the translated field')

      await writeEntity(args.payload, args.entity, targetLocale, data)
      succeeded.push(targetLocale)
    } catch (error) {
      failed.push({
        locale: targetLocale,
        error: error instanceof Error ? error.message : 'Translation failed',
      })
    }
  }

  return { succeeded, failed }
}
