import type { Payload } from 'payload'

import {
  parseTranslationMap,
  type TranslationMap,
} from '@/collections/Translations/parseTranslationMap'
import {
  isAdminLanguageCode,
  type AdminLanguageCode,
} from '@/i18n/adminLanguagePacks'

/** Admin UI languages used for admin.* DeepL fills (subset of admin language packs). */
export const ADMIN_I18N_LOCALES = ['en', 'de', 'fr', 'es', 'it', 'nl'] as const

export type AdminI18nLocale = (typeof ADMIN_I18N_LOCALES)[number]

const COLLECTION_SLUG = 'translations' as const
/** Concurrent create/update writes when persisting seeded admin.* rows. */
const DB_WRITE_CONCURRENCY = 12

type AdminI18nStore = {
  registry: Map<string, string>
  /** Same object references held by collection/global configs. */
  labelObjects: Map<string, Record<string, string>>
  cache: Map<string, TranslationMap>
  /** DB document ids for admin.* keys (filled during hydrate). */
  ids: Map<string, string | number>
  seedPromise: Promise<void> | null
}

declare global {
  // eslint-disable-next-line no-var
  var __jancoAdminI18n: AdminI18nStore | undefined
}

function store(): AdminI18nStore {
  if (!globalThis.__jancoAdminI18n) {
    globalThis.__jancoAdminI18n = {
      registry: new Map(),
      labelObjects: new Map(),
      cache: new Map(),
      ids: new Map(),
      seedPromise: null,
    }
  } else {
    const existing = globalThis.__jancoAdminI18n as Partial<AdminI18nStore>
    if (!existing.ids) existing.ids = new Map()
    if (!('seedPromise' in existing)) existing.seedPromise = null
  }
  return globalThis.__jancoAdminI18n
}

function normalizeAdminKey(key: string): string {
  const trimmed = key.trim()
  if (!trimmed) {
    throw new Error('adminI18n: translation key must be non-empty')
  }
  return trimmed.startsWith('admin.') ? trimmed : `admin.${trimmed}`
}

function normalizeLang(language?: string | null): string {
  const raw = (language ?? 'en').trim().toLowerCase() || 'en'
  return raw.split('-')[0] || 'en'
}

function resolveLabel(fullKey: string, fallback: string, language?: string | null): string {
  const lang = normalizeLang(language)
  const cached = store().cache.get(fullKey)
  return cached?.[lang] ?? cached?.en ?? fallback
}

function isAdminI18nLocale(code: string): code is AdminI18nLocale {
  return (ADMIN_I18N_LOCALES as readonly string[]).includes(code)
}

/**
 * Resolve which admin.* locales to fill: Localization Account Languages ∩ packs.
 * Always includes `en`. Falls back to all packs when nothing usable is provided.
 */
export function resolveAdminI18nTargetLocales(
  preferred?: readonly string[] | null,
): AdminI18nLocale[] {
  const fromPreferred = (preferred ?? [])
    .map((code) => code.trim().toLowerCase())
    .filter(isAdminI18nLocale)

  const unique = Array.from(new Set<AdminI18nLocale>(['en', ...fromPreferred]))
  if (unique.length === 1 && (!preferred || preferred.length === 0)) {
    return [...ADMIN_I18N_LOCALES]
  }
  return unique
}

/**
 * Write concrete en/de/es/… values onto the label object that configs already hold.
 * Prefer cache hits. On cache miss, only fill missing locale slots — never clobber
 * existing translated values with the English fallback (HMR / late registration).
 */
function materializeLabelObject(
  fullKey: string,
  obj: Record<string, string>,
  fallback: string,
): void {
  const cached = store().cache.get(fullKey)

  for (const lang of ADMIN_I18N_LOCALES) {
    if (cached?.[lang]) {
      obj[lang] = cached[lang]
      continue
    }
    if (cached?.en && !obj[lang]) {
      // Incomplete cache row — use English until DeepL fills this locale
      obj[lang] = cached.en
      continue
    }
    if (!obj[lang]) {
      obj[lang] = fallback
    }
  }
}

function materializeAllLabelObjects(): void {
  const s = store()
  for (const [key, obj] of s.labelObjects) {
    materializeLabelObject(key, obj, s.registry.get(key) ?? key)
  }
}

function clearPayloadClientConfigCache(): void {
  try {
    const g = globalThis as typeof globalThis & {
      _payload_clientConfigs?: Record<string, unknown>
      _payload_doNotCacheClientConfig?: boolean
    }
    const cached = g._payload_clientConfigs
    if (cached && typeof cached === 'object') {
      for (const key of Object.keys(cached)) {
        delete cached[key]
      }
    } else {
      g._payload_clientConfigs = {}
    }
    g._payload_doNotCacheClientConfig = true
  } catch {
    // ignore
  }
}

/**
 * Localized admin string for labels, placeholders, descriptions, groups, etc.
 * Keys are stored in Translations as `admin.*` and filled via DeepL on seed.
 */
export function a(key: string, english: string): Record<string, string> {
  const fullKey = normalizeAdminKey(key)
  const fallback = english
  const s = store()

  if (!s.registry.has(fullKey)) {
    s.registry.set(fullKey, fallback)
  }

  let obj = s.labelObjects.get(fullKey)
  if (!obj) {
    obj = {}
    s.labelObjects.set(fullKey, obj)
  }

  // Refresh from cache when available (HMR / late seed). Never wipe good locales on miss.
  materializeLabelObject(fullKey, obj, fallback)
  return obj
}

export function aString(key: string, english: string, language?: string | null): string {
  const fullKey = normalizeAdminKey(key)
  if (!store().registry.has(fullKey)) {
    store().registry.set(fullKey, english)
  }
  return resolveLabel(fullKey, english, language)
}

export function setAdminTranslationCache(key: string, translations: TranslationMap): void {
  if (!key.startsWith('admin.')) return
  const s = store()
  s.cache.set(key, {
    ...parseTranslationMap(s.cache.get(key)),
    ...translations,
  })
  const obj = s.labelObjects.get(key)
  if (obj) {
    materializeLabelObject(key, obj, s.registry.get(key) ?? key)
  }
  clearPayloadClientConfigCache()
}

export function getRegisteredAdminStrings(): ReadonlyMap<string, string> {
  return store().registry
}

function countIncompleteKeys(targetLocales: readonly AdminI18nLocale[]): number {
  const s = store()
  let incomplete = 0
  for (const key of s.registry.keys()) {
    const map = s.cache.get(key)
    if (!map) {
      incomplete += 1
      continue
    }
    if (targetLocales.some((lang) => !map[lang])) incomplete += 1
  }
  return incomplete
}

/**
 * Load every admin.* row into the in-memory cache (paginated — do not rely on a single
 * `like` query, which can miss rows depending on adapter limits).
 */
async function hydrateCacheFromDb(payload: Payload): Promise<number> {
  const s = store()
  let page = 1
  let hydrated = 0
  const limit = 500

  for (;;) {
    const { docs, hasNextPage } = await payload.find({
      collection: COLLECTION_SLUG,
      limit,
      page,
      depth: 0,
      overrideAccess: true,
      pagination: true,
    })

    for (const doc of docs) {
      if (typeof doc.key !== 'string' || !doc.key.startsWith('admin.')) continue
      s.cache.set(doc.key, parseTranslationMap(doc.translations))
      s.ids.set(doc.key, doc.id)
      hydrated += 1
    }

    if (!hasNextPage) break
    page += 1
  }

  return hydrated
}

async function persistTranslationMap(
  payload: Payload,
  key: string,
  translations: TranslationMap,
): Promise<void> {
  const s = store()
  const existingId = s.ids.get(key)

  if (existingId != null) {
    await payload.update({
      collection: COLLECTION_SLUG,
      id: existingId,
      data: { translations },
      overrideAccess: true,
    })
    return
  }

  const created = await payload.create({
    collection: COLLECTION_SLUG,
    data: { key, translations },
    overrideAccess: true,
  })
  s.ids.set(key, created.id)
}

async function persistMapsInBatches(
  payload: Payload,
  rows: Array<{ key: string; translations: TranslationMap }>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += DB_WRITE_CONCURRENCY) {
    const chunk = rows.slice(i, i + DB_WRITE_CONCURRENCY)
    await Promise.all(
      chunk.map(({ key, translations }) => persistTranslationMap(payload, key, translations)),
    )
  }
}

export type SeedAdminTranslationsOptions = {
  /** Account Language codes from Localization (e.g. en, es, de). */
  locales?: readonly string[] | null
}

/**
 * If HMR registered new `a()` keys after the last seed, pull them from DB (or DeepL)
 * and rematerialize label objects so the admin UI picks up DE/ES/… strings.
 */
export async function ensureAdminI18nSynced(
  payload: Payload,
  options?: SeedAdminTranslationsOptions,
): Promise<void> {
  const s = store()
  if (s.seedPromise) {
    await s.seedPromise
  }

  const targetLocales = resolveAdminI18nTargetLocales(
    options?.locales ?? readSupportedAdminLanguageCodes(payload),
  )
  const incomplete = countIncompleteKeys(targetLocales)
  if (incomplete === 0) return

  payload.logger.info(
    `[adminI18n] Syncing ${incomplete} admin.* keys missing locales (${targetLocales.join(', ')})…`,
  )
  await seedAdminTranslations(payload, { locales: targetLocales })
}

function readSupportedAdminLanguageCodes(payload: Payload): AdminLanguageCode[] {
  const supported = payload.config.i18n.supportedLanguages as Record<string, unknown>
  return Object.keys(supported).filter(
    (key): key is AdminLanguageCode => Boolean(supported[key]) && isAdminLanguageCode(key),
  )
}

/**
 * Seed admin.* Translations for Localization Account Languages only.
 * Batches DeepL (many strings / request) and DB writes (one upsert per key).
 * Concurrent callers share one in-flight promise.
 */
export async function seedAdminTranslations(
  payload: Payload,
  options?: SeedAdminTranslationsOptions,
): Promise<void> {
  const s = store()
  if (s.seedPromise) return s.seedPromise

  s.seedPromise = runSeedAdminTranslations(payload, options).finally(() => {
    s.seedPromise = null
  })
  return s.seedPromise
}

async function runSeedAdminTranslations(
  payload: Payload,
  options?: SeedAdminTranslationsOptions,
): Promise<void> {
  const { translateManyWithDeepL } = await import('@/utilities/deepl')
  const { getDeepLSettings } = await import('@/settings/deepl/server')
  const s = store()

  const targetLocales = resolveAdminI18nTargetLocales(
    options?.locales ?? readSupportedAdminLanguageCodes(payload),
  )

  const hydrated = await hydrateCacheFromDb(payload)
  const entries = Array.from(s.registry.entries())
  if (entries.length === 0) return

  const incompleteBefore = countIncompleteKeys(targetLocales)
  if (incompleteBefore === 0) {
    materializeAllLabelObjects()
    clearPayloadClientConfigCache()
    payload.logger.info(
      `[adminI18n] admin.* cache already complete for ${targetLocales.join(', ')} (${entries.length} keys, hydrated ${hydrated})`,
    )
    return
  }

  const deepl = await getDeepLSettings()
  const translateLocales = deepl.enabled
    ? targetLocales.filter((lang) => lang !== 'en')
    : ([] as AdminI18nLocale[])

  // Ensure English is present in-memory for every registered key before DeepL.
  const englishRows: Array<{ key: string; translations: TranslationMap }> = []
  for (const [key, fallback] of entries) {
    const map: TranslationMap = { ...(s.cache.get(key) ?? {}) }
    if (!map.en) {
      map.en = fallback
      s.cache.set(key, map)
      englishRows.push({ key, translations: { ...map } })
    }
  }
  if (englishRows.length > 0) {
    await persistMapsInBatches(payload, englishRows)
  }

  let translated = 0

  for (const lang of translateLocales) {
    const pending: Array<{ key: string; source: string }> = []
    for (const [key, fallback] of entries) {
      const map = s.cache.get(key) ?? {}
      if (map[lang]) continue
      pending.push({ key, source: map.en ?? fallback })
    }
    if (pending.length === 0) continue

    payload.logger.info(
      `[adminI18n] Batch-translating ${pending.length} admin.* strings → ${lang}`,
    )

    const results = await translateManyWithDeepL(
      pending.map((row) => row.source),
      lang,
      'en',
      deepl,
    )

    const dirty: Array<{ key: string; translations: TranslationMap }> = []
    for (let i = 0; i < pending.length; i += 1) {
      const row = pending[i]!
      const text = results[i]
      if (!text) continue

      const map: TranslationMap = { ...(s.cache.get(row.key) ?? {}) }
      if (!map.en) map.en = row.source
      map[lang] = text
      translated += 1
      s.cache.set(row.key, map)
      dirty.push({ key: row.key, translations: map })
    }

    await persistMapsInBatches(payload, dirty)
  }

  // When DeepL is off, mirror English into remaining target locale slots once.
  if (!deepl.enabled) {
    const dirty: Array<{ key: string; translations: TranslationMap }> = []
    for (const [key, fallback] of entries) {
      const map: TranslationMap = { ...(s.cache.get(key) ?? {}) }
      let changed = false
      if (!map.en) {
        map.en = fallback
        changed = true
      }
      for (const lang of targetLocales) {
        if (!map[lang]) {
          map[lang] = map.en
          changed = true
        }
      }
      if (changed) {
        s.cache.set(key, map)
        dirty.push({ key, translations: map })
      }
    }
    if (dirty.length > 0) {
      await persistMapsInBatches(payload, dirty)
    }
  }

  materializeAllLabelObjects()
  clearPayloadClientConfigCache()

  const sample = s.labelObjects.get('admin.blocks.heroBlock.titleLabel')
  payload.logger.info(
    `[adminI18n] Seeded ${entries.length} admin.* keys for ${targetLocales.join(', ')} (hydrated ${hydrated}, DeepL fills ${translated}; DeepL ${deepl.enabled ? 'on' : 'off'}; titleLabel=${JSON.stringify(sample)}; cache=${s.cache.size})`,
  )
}
