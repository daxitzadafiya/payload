import type { AuditAction, FieldChange } from './constants'

function isDeletedFlag(value: unknown): boolean {
  return value === true || value === 'true'
}

function hasTrashTimestamp(value: unknown): boolean {
  return value != null && value !== ''
}

function isSoftDeleteFieldPath(field: string): boolean {
  return field === 'isDeleted' || field.endsWith('.isDeleted')
}

/**
 * Map soft-delete / restore updates to Delete / Restore audit actions.
 * - Document trash: deletedAt / trashedAt set or cleared
 * - Array rows: isDeleted true → Delete, false → Restore
 */
export function inferSoftDeleteAuditAction(
  previous: Record<string, unknown> | null,
  next: Record<string, unknown> | null,
  changes: FieldChange[],
): Extract<AuditAction, 'delete' | 'restore'> | null {
  const prevTrash = previous?.deletedAt ?? previous?.trashedAt
  const nextTrash = next?.deletedAt ?? next?.trashedAt

  if (!hasTrashTimestamp(prevTrash) && hasTrashTimestamp(nextTrash)) {
    return 'delete'
  }
  if (hasTrashTimestamp(prevTrash) && !hasTrashTimestamp(nextTrash)) {
    return 'restore'
  }

  const softFlagChanges = changes.filter((change) => isSoftDeleteFieldPath(change.field))
  if (softFlagChanges.length === 0) {
    return null
  }

  const deleted = softFlagChanges.some(
    (change) => !isDeletedFlag(change.oldValue) && isDeletedFlag(change.newValue),
  )
  const restored = softFlagChanges.some(
    (change) => isDeletedFlag(change.oldValue) && !isDeletedFlag(change.newValue),
  )

  if (deleted && !restored) return 'delete'
  if (restored && !deleted) return 'restore'
  return null
}
