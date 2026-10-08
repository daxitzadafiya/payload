import type { FieldHook } from 'payload'

import { defaultLocale, localeCodes } from '@/i18n/locales'
import {
  isTranslationWrite,
  translationTargetLocale,
} from '@/utilities/autoTranslate/context'

function textOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function fallbackLabel(siblingData: Record<string, unknown> | undefined): string {
  const fromValue = textOrEmpty(siblingData?.value)
  if (fromValue) return fromValue.charAt(0).toUpperCase() + fromValue.slice(1)
  return 'Option'
}

function resolveLocales(req: unknown): readonly string[] {
  const localeCodesFromConfig = (
    req as {
      payload?: { config?: { localization?: false | { localeCodes?: string[] } } }
    } | null
  )?.payload?.config?.localization
  if (localeCodesFromConfig && localeCodesFromConfig.localeCodes?.length) {
    return localeCodesFromConfig.localeCodes
  }
  return localeCodes
}

function asLocaleRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function localeFromUnknown(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() && value !== 'all') {
    return value.trim().toLowerCase()
  }
  if (Array.isArray(value) && value.length > 0) {
    return localeFromUnknown(value[0])
  }
  if (value && typeof value === 'object' && 'code' in value) {
    return localeFromUnknown((value as { code?: unknown }).code)
  }
  return undefined
}

/**
 * Content locale for this save. Prefer the admin query (`?locale=es`) over
 * `req.locale`, because `findGlobal({ locale: 'all', req })` mutates the parent
 * request to `locale: 'all'` and Payload then ignores the field-hook return.
 */
export function resolveRequestLocale(req: unknown): string | undefined {
  const record = req as {
    locale?: unknown
    query?: { locale?: unknown; get?: (key: string) => unknown }
    searchParams?: { get?: (key: string) => unknown }
  } | null

  const fromQueryGet =
    typeof record?.query?.get === 'function' ? record.query.get('locale') : undefined
  const fromSearch =
    typeof record?.searchParams?.get === 'function' ? record.searchParams.get('locale') : undefined

  const candidates = [record?.query?.locale, fromQueryGet, fromSearch, record?.locale]
  for (const candidate of candidates) {
    const locale = localeFromUnknown(candidate)
    if (locale) return locale
  }
  return undefined
}

/** Keep mergeLocaleActions on the content locale, not `all` leftover from findGlobal. */
export function pinRequestLocale(req: unknown): string | undefined {
  const locale = resolveRequestLocale(req)
  if (!locale || !req || typeof req !== 'object') return locale
  const record = req as { locale?: unknown }
  if (record.locale !== locale) record.locale = locale
  return locale
}

function isValuePlaceholder(text: string, rowValue: string): boolean {
  if (!text) return true
  if (!rowValue) return false
  if (text === rowValue) return true
  return text === rowValue.charAt(0).toUpperCase() + rowValue.slice(1)
}

function labelForLocale(label: unknown, locale: string | undefined): string {
  const text = textOrEmpty(label)
  if (text) return text
  const record = asLocaleRecord(label)
  if (!record || !locale) return ''
  return textOrEmpty(record[locale])
}

/**
 * Payload may submit localized labels as a locale map. Nested field hooks and
 * mergeLocaleActions expect a current-locale string — an object here gets nested
 * into the current locale column and the typed text is lost after save.
 */
export function flattenOptionLabelsForSave(value: unknown, locale?: string): unknown {
  if (!Array.isArray(value) || !locale || locale === 'all') return value

  return value.map((row) => {
    if (!row || typeof row !== 'object') return row
    const item = row as Record<string, unknown>
    const current = labelForLocale(item.label, locale)
    if (!current) return item
    return { ...item, label: current }
  })
}

/**
 * Build a non-null label for every CMS locale. Version tables insert one row per
 * locale and `label` is NOT NULL — empty keys crash SQLite on save.
 */
export function fillAllLocaleLabels(
  label: unknown,
  fallback: string,
  locales: readonly string[],
): Record<string, string> {
  const source = asLocaleRecord(label) ?? {}

  const existing = Object.values(source).find(
    (value) => typeof value === 'string' && value.trim(),
  )
  const base =
    (typeof existing === 'string' && existing.trim()) || fallback.trim() || 'Option'

  const record: Record<string, string> = {}
  for (const code of locales) {
    const current = source[code]
    record[code] = typeof current === 'string' && current.trim() ? current.trim() : base
  }
  return record
}

function applyIncomingLabel(args: {
  filled: Record<string, string>
  incomingText: string
  locales: readonly string[]
  locale: string | undefined
  previousText: string
  rowValue: string
  source: unknown
}): void {
  const { filled, incomingText, locales, locale, previousText, rowValue, source } = args
  const sourceRecord = asLocaleRecord(source)

  if (locale) {
    filled[locale] = incomingText
    // Only English (source) saves fill empty/placeholder locales for DeepL.
    // A Spanish edit must not copy Spanish onto English or other languages.
    if (locale !== defaultLocale) return

    for (const code of locales) {
      if (code === locale) continue
      const existing = textOrEmpty(sourceRecord?.[code])
      if (isValuePlaceholder(existing, rowValue)) {
        filled[code] = incomingText
      }
    }
    return
  }

  // Payload nested array hooks sometimes omit req.locale. Update only locales
  // that still have the previous current-locale string (the row being edited).
  if (previousText) {
    let matched = false
    for (const code of locales) {
      if (filled[code] === previousText) {
        filled[code] = incomingText
        matched = true
      }
    }
    if (matched) return
  }

  filled[defaultLocale] = incomingText
}

/**
 * Version tables require a non-null `label` for every locale row.
 * Payload copies siblingDocWithLocales keys (including null) when flattening
 * locales. New array rows start with an empty sibling doc, so we seed every
 * configured locale before that merge runs.
 *
 * Always return a current-locale string on a single-locale save. Returning a
 * locale map makes Payload nest that map under the current locale and the
 * editor's text is discarded.
 */
export const ensureLocalizedOptionLabel: FieldHook = ({
  value,
  previousValue,
  siblingData,
  siblingDocWithLocales,
  context,
  req,
}) => {
  const sibling = siblingData as Record<string, unknown> | undefined
  const fallback = fallbackLabel(sibling)
  const locales = resolveLocales(req)
  const locale = pinRequestLocale(req)
  const incomingIsObject = Boolean(asLocaleRecord(value))
  const stored = (siblingDocWithLocales as { label?: unknown } | undefined)?.label
  const reqWithContext = req as { context?: Record<string, unknown>; locale?: unknown }
  const translating = isTranslationWrite(
    context as Record<string, unknown> | undefined,
    reqWithContext,
  )
  const writeLocale = translating
    ? translationTargetLocale(context as Record<string, unknown> | undefined, reqWithContext) ||
      locale
    : locale
  const source = incomingIsObject && !translating ? value : stored

  const incomingText = incomingIsObject
    ? labelForLocale(value, writeLocale)
    : textOrEmpty(value)

  const docWithLocales = siblingDocWithLocales as { label?: unknown } | undefined

  // Always keep a full locale map. Version tables insert one row per locale
  // (label is NOT NULL); dropping keys makes that insert fail and Payload rolls
  // the whole global save back — the editor sees the old label return.
  // DeepL must not use the translated string as the fill for missing locales
  // (that would copy Dutch onto English).
  const fillFallback = translating ? fallback : incomingText || fallback
  const filled = fillAllLocaleLabels(source, fillFallback, locales)

  if (translating) {
    if (incomingText && writeLocale) filled[writeLocale] = incomingText
  } else if (incomingText) {
    applyIncomingLabel({
      filled,
      incomingText,
      locales,
      locale: writeLocale,
      previousText:
        textOrEmpty(previousValue) || labelForLocale(previousValue, writeLocale),
      rowValue: textOrEmpty(sibling?.value),
      source,
    })
  }

  if (docWithLocales && typeof docWithLocales === 'object') {
    docWithLocales.label = filled
  }

  // locale:all saves need the full map. Single-locale saves must return a string
  // so mergeLocaleActions writes that string into the current locale column.
  if (!locale && incomingIsObject) return filled
  return incomingText || fallback
}

/** Keep rows that have a value/label, and backfill an empty string label from value. */
export function dropEmptyOptionRows(value: unknown): unknown {
  if (!Array.isArray(value)) return value

  return value
    .filter((row) => {
      if (!row || typeof row !== 'object') return false
      const item = row as { value?: unknown; label?: unknown; isDeleted?: unknown }
      if (item.isDeleted) return true

      if (textOrEmpty(item.value)) return true
      if (textOrEmpty(item.label)) return true
      if (item.label && typeof item.label === 'object') {
        return Object.values(item.label).some((label) => textOrEmpty(label))
      }
      return false
    })
    .map((row) => {
      const item = row as Record<string, unknown>
      if (typeof item.label === 'string' && item.label.trim()) return item
      if (item.label && typeof item.label === 'object') return item
      const fallback = fallbackLabel(item)
      return { ...item, label: fallback }
    })
}
