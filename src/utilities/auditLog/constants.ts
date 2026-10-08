export const ACTIVITY_LOGS_SLUG = 'activity-logs'

/** Collections that must never be audit-logged (system + self). */
export const EXCLUDED_SLUGS = new Set([
  ACTIVITY_LOGS_SLUG,
  'global-version-snapshots',
  'payload-kv',
  'payload-jobs',
  'payload-locked-documents',
  'payload-preferences',
  'payload-migrations',
  'payload-folders',
])

/** Top-level / segment keys ignored when computing diffs. */
export const IGNORED_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'deletedAt',
  'trashedAt',
  '__v',
  'id',
  'collection',
  'globalType',
])

export const SETTINGS_GLOBAL_SLUGS = new Set([
  'emailSettings',
  'optimaCrmSettings',
  'deeplSettings',
  'integrationsSettings',
  'weatherSettings',
])

export const MCP_COLLECTION_SLUG = 'payload-mcp-api-keys'

/** Matches field path segments that should never be stored in plaintext. */
export const SENSITIVE_FIELD_PATTERN =
  /^(password|secret|token|api[_-]?key|userkey|apikeyindex|secretkey|resetpasswordtoken|recaptchatoken)$/i

export const REDACTED_VALUE = '[REDACTED]'

export type AuditModule = 'Collections' | 'Globals' | 'Settings' | 'MCP'
export type AuditAction = 'create' | 'update' | 'delete' | 'restore'

export type FieldChange = {
  field: string
  oldValue: unknown
  newValue: unknown
}
