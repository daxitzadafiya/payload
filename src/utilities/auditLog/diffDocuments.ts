import { IGNORED_FIELDS, type FieldChange } from './constants'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
}

/** Collapse populated relationships / uploads to a stable id for comparison. */
export function normalizeValue(value: unknown): unknown {
  if (value === undefined) return undefined
  if (value === null) return null

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item))
  }

  if (isPlainObject(value)) {
    // Relationship / upload docs often look like { id, ... }
    if ('id' in value && Object.keys(value).length > 1) {
      const keys = Object.keys(value)
      const looksLikeDoc =
        keys.includes('updatedAt') ||
        keys.includes('createdAt') ||
        keys.includes('collection') ||
        typeof (value as { filename?: unknown }).filename === 'string'
      if (looksLikeDoc) {
        return value.id
      }
    }

    const out: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) {
      if (IGNORED_FIELDS.has(key)) continue
      out[key] = normalizeValue(child)
    }
    return out
  }

  return value
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null || a === undefined || b === undefined) {
    return a === b
  }
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

function walkDiff(oldVal: unknown, newVal: unknown, path: string, changes: FieldChange[]): void {
  const oldN = normalizeValue(oldVal)
  const newN = normalizeValue(newVal)

  if (valuesEqual(oldN, newN)) return

  const oldIsObj = isPlainObject(oldN)
  const newIsObj = isPlainObject(newN)
  const oldIsArr = Array.isArray(oldN)
  const newIsArr = Array.isArray(newN)

  // Dive into objects when both sides are objects
  if (oldIsObj && newIsObj) {
    const keys = new Set([...Object.keys(oldN), ...Object.keys(newN)])
    for (const key of keys) {
      if (IGNORED_FIELDS.has(key)) continue
      const childPath = path ? `${path}.${key}` : key
      walkDiff(oldN[key], newN[key], childPath, changes)
    }
    return
  }

  // Dive into arrays when both sides are arrays of objects (field arrays)
  if (oldIsArr && newIsArr) {
    const max = Math.max(oldN.length, newN.length)
    let canDive = true
    for (let i = 0; i < max; i++) {
      const o = oldN[i]
      const n = newN[i]
      if (
        (o !== undefined && !isPlainObject(o) && !Array.isArray(o)) ||
        (n !== undefined && !isPlainObject(n) && !Array.isArray(n))
      ) {
        // Primitive arrays — treat as atomic
        canDive = false
        break
      }
    }
    if (canDive) {
      for (let i = 0; i < max; i++) {
        const childPath = path ? `${path}.${i}` : String(i)
        walkDiff(oldN[i], newN[i], childPath, changes)
      }
      return
    }
  }

  // Leaf / structural change
  if (!path) {
    // Root-level replacement with no path shouldn't happen for docs; skip
    return
  }

  changes.push({
    field: path,
    oldValue: oldN === undefined ? null : oldN,
    newValue: newN === undefined ? null : newN,
  })
}

/**
 * Returns only fields that changed between previous and next documents.
 * For create, pass `previous = null`. For delete, pass `next = null`.
 */
export function diffDocuments(previous: unknown, next: unknown): FieldChange[] {
  const changes: FieldChange[] = []

  const prevObj = isPlainObject(previous) ? previous : {}
  const nextObj = isPlainObject(next) ? next : {}

  const keys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)])
  for (const key of keys) {
    if (IGNORED_FIELDS.has(key)) continue
    walkDiff(prevObj[key], nextObj[key], key, changes)
  }

  return changes
}
