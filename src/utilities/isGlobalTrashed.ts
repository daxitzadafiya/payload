/** True when a global document has been soft-deleted via Globals Trash. */
export function isGlobalTrashed(doc: unknown): boolean {
  if (!doc || typeof doc !== 'object') return false
  const record = doc as { trashedAt?: unknown; deletedAt?: unknown }
  const trashedAt = record.trashedAt ?? record.deletedAt
  return trashedAt != null && trashedAt !== ''
}
