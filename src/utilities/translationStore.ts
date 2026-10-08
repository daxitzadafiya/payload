type PendingItem = {
  language: string
  key: string
  fallback: string
}

type BatchResponse = {
  translations?: Record<string, string>
}

const resolved = new Map<string, string>()
const pending = new Map<string, PendingItem>()
const listeners = new Set<() => void>()

let flushScheduled = false

function entryKey(language: string, key: string): string {
  return `${language.trim().toLowerCase() || 'en'}::${key}`
}

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

function scheduleFlush(): void {
  if (flushScheduled) return
  flushScheduled = true

  queueMicrotask(() => {
    flushScheduled = false
    void flushBatch()
  })
}

async function flushBatch(): Promise<void> {
  if (pending.size === 0) return

  const items = Array.from(pending.values())
  pending.clear()

  const byLanguage = new Map<string, Array<{ key: string; fallback: string }>>()

  for (const { language, key, fallback } of items) {
    const group = byLanguage.get(language) ?? []
    group.push({ key, fallback })
    byLanguage.set(language, group)
  }

  try {
    await Promise.all(
      Array.from(byLanguage.entries()).map(async ([language, langItems]) => {
        const response = await fetch('/api/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, items: langItems }),
        })

        if (!response.ok) {
          for (const { key, fallback } of langItems) {
            resolved.set(entryKey(language, key), fallback)
          }
          return
        }

        const data = (await response.json()) as BatchResponse
        const translations = data.translations ?? {}

        for (const { key, fallback } of langItems) {
          const text = translations[key] ?? fallback
          resolved.set(entryKey(language, key), text)
        }
      }),
    )
  } catch {
    for (const { language, key, fallback } of items) {
      resolved.set(entryKey(language, key), fallback)
    }
  }

  notify()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isTranslationResolved(key: string, language: string): boolean {
  return resolved.has(entryKey(language, key))
}

export function getTranslationSnapshot(
  key: string,
  language: string,
  fallbackValue: string,
): string {
  return resolved.get(entryKey(language, key)) ?? fallbackValue
}

export function requestTranslation(
  key: string,
  language: string,
  fallbackValue: string,
): void {
  const lang = language.trim().toLowerCase() || 'en'
  const mapKey = entryKey(lang, key)

  if (resolved.has(mapKey)) return

  pending.set(mapKey, { language: lang, key, fallback: fallbackValue })
  scheduleFlush()
}

/** Drop cached strings for a locale so components re-fetch after a language switch. */
export function invalidateTranslationsForLocale(language: string): void {
  const lang = language.trim().toLowerCase() || 'en'
  const prefix = `${lang}::`
  let changed = false

  for (const mapKey of resolved.keys()) {
    if (mapKey.startsWith(prefix)) {
      resolved.delete(mapKey)
      changed = true
    }
  }

  if (changed) {
    notify()
  }
}
