import { EXCLUDED_SLUGS } from '@/utilities/auditLog/constants'

/**
 * Collections that must not get native trash.
 * Keep this to system/internal collections only — content collections
 * (pages, posts, media, categories, users, translations, countries,
 * redirects, forms, form-submissions, search, …) all get trash + permanent delete
 * the same way as Pages.
 */
export const TRASH_VERSIONS_COLLECTION_OPT_OUT = new Set<string>([
  ...EXCLUDED_SLUGS,
  'global-version-snapshots',
])

export const DEFAULT_MAX_PER_DOC = 50

/** Not `deletedAt` — Payload treats that as native collection trash and crashes globals (`id.toString()`). */
export const GLOBAL_DELETED_AT_FIELD = 'trashedAt' as const

export const GLOBALS_TRASH_PATH = '/globals-trash' as const
