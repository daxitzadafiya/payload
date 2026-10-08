export const AUTO_TRANSLATING_CONTEXT_KEY = 'autoTranslating'
export const FORCE_TRANSLATE_TARGET_LOCALE_KEY = 'forceTranslateTargetLocale'

export function isAutoTranslating(context: Record<string, unknown> | undefined): boolean {
  return context?.[AUTO_TRANSLATING_CONTEXT_KEY] === true
}

function asContext(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined
}

/**
 * Nested DeepL / Force Translate writes.
 * `skipAutoTranslate` is NOT this — that flag only means "do not queue DeepL
 * after this save" (tests, trash restore). Treating it as a translation write
 * dropped other locale labels and rolled the editor's save back.
 */
export function isTranslationWrite(
  context?: Record<string, unknown>,
  req?: { context?: Record<string, unknown> },
): boolean {
  const merged = { ...asContext(req?.context), ...asContext(context) }
  return isAutoTranslating(merged)
}

export function translationTargetLocale(
  context?: Record<string, unknown>,
  req?: { context?: Record<string, unknown>; locale?: unknown },
): string | undefined {
  const merged = { ...asContext(req?.context), ...asContext(context) }
  const fromContext = merged?.[FORCE_TRANSLATE_TARGET_LOCALE_KEY]
  if (typeof fromContext === 'string' && fromContext && fromContext !== 'all') return fromContext
  return typeof req?.locale === 'string' && req.locale && req.locale !== 'all' ? req.locale : undefined
}
