export type TranslationMap = Record<string, string>

export function parseTranslationMap(value: unknown): TranslationMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const map: TranslationMap = {}
  for (const [locale, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text === 'string' && text.trim()) {
      map[locale.trim().toLowerCase()] = text
    }
  }
  return map
}
