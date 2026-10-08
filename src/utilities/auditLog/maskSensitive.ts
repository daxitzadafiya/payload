import { REDACTED_VALUE, SENSITIVE_FIELD_PATTERN, type FieldChange } from './constants'

export function isSensitiveFieldPath(path: string): boolean {
  return path.split('.').some((segment) => {
    // Array indices like "0" are not sensitive by themselves
    if (/^\d+$/.test(segment)) return false
    return SENSITIVE_FIELD_PATTERN.test(segment)
  })
}

export function maskValue(path: string, value: unknown): unknown {
  if (value === undefined || value === null) return value
  if (!isSensitiveFieldPath(path)) return value
  return REDACTED_VALUE
}

export function maskFieldChanges(changes: FieldChange[]): FieldChange[] {
  return changes.map(({ field, oldValue, newValue }) => ({
    field,
    oldValue: maskValue(field, oldValue),
    newValue: maskValue(field, newValue),
  }))
}
