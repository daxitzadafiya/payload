import { isLexicalRichText } from './lexicalText'

export type LocalizedStringField = {
  /** Stable path used for patch matching (array rows use their `id` when present). */
  path: string
  value: string
}

export type LocalizedRichTextField = {
  path: string
  value: Record<string, unknown>
}

type PathToken =
  | { type: 'key'; name: string }
  | { type: 'array'; selector: string }

/** Split `offices[].city` into walkable segments. */
export function parseFieldPath(fieldPath: string): Array<string | '[]'> {
  const segments: Array<string | '[]'> = []
  const parts = fieldPath.split('.')

  for (const part of parts) {
    if (part.endsWith('[]')) {
      const name = part.slice(0, -2)
      if (name) segments.push(name)
      segments.push('[]')
      continue
    }

    if (part) segments.push(part)
  }

  return segments
}

export function itemId(item: unknown): string {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return ''
  const id = (item as { id?: unknown }).id
  if (typeof id === 'string' && id.trim()) return id.trim()
  if (typeof id === 'number' && Number.isFinite(id)) return String(id)
  return ''
}

function arraySelector(item: unknown, index: number): string {
  return itemId(item) || String(index)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function matchAlignedArrayItem(
  sourceArray: unknown[],
  targetArray: unknown[],
  previousArray: unknown[],
  selector: string,
): { source: unknown; target: unknown; previous: unknown } {
  const sourceItem = resolveArrayItem(sourceArray, selector)
  const sourceIndex = sourceItem ? sourceArray.indexOf(sourceItem) : Number(selector)
  const sourceItemId = itemId(sourceItem)

  let previousIndex = -1
  if (sourceItemId) {
    previousIndex = previousArray.findIndex((item) => itemId(item) === sourceItemId)
  }
  if (previousIndex < 0 && Number.isInteger(sourceIndex) && sourceIndex >= 0) {
    previousIndex = sourceIndex
  }

  const targetById = sourceItemId ? resolveArrayItem(targetArray, sourceItemId) : null
  const targetItem =
    targetById ??
    (previousIndex >= 0 ? targetArray[previousIndex] : undefined) ??
    (Number.isInteger(sourceIndex) && sourceIndex >= 0 ? targetArray[sourceIndex] : undefined)

  const previousItem = previousIndex >= 0 ? previousArray[previousIndex] : undefined

  return { source: sourceItem, target: targetItem, previous: previousItem }
}

/**
 * Read a value from `target` using a source-locale canonical path.
 * Localized arrays mint different row IDs per locale, so matching falls back to
 * the previous source row index (same logic as ensureUniqueLocalizedArrayIds).
 */
export function getAtAlignedPath(
  target: unknown,
  canonicalPath: string,
  source: unknown,
  previousSource?: unknown,
): unknown {
  const tokens = tokenizeCanonicalPath(canonicalPath)
  let sourceNode: unknown = source
  let targetNode: unknown = target
  let previousNode: unknown = previousSource ?? null

  for (const token of tokens) {
    if (token.type === 'key') {
      sourceNode = isRecord(sourceNode) ? sourceNode[token.name] : undefined
      targetNode = isRecord(targetNode) ? targetNode[token.name] : undefined
      previousNode = isRecord(previousNode) ? previousNode[token.name] : undefined
      continue
    }

    const matched = matchAlignedArrayItem(
      Array.isArray(sourceNode) ? sourceNode : [],
      Array.isArray(targetNode) ? targetNode : [],
      Array.isArray(previousNode) ? previousNode : [],
      token.selector,
    )
    sourceNode = matched.source
    targetNode = matched.target
    previousNode = matched.previous
  }

  return targetNode
}

function tokenizeCanonicalPath(path: string): PathToken[] {
  const tokens: PathToken[] = []
  const parts = path.split('.')

  for (const part of parts) {
    const arrayMatch = part.match(/^(.+)\[([^\]]+)\]$/)
    if (arrayMatch) {
      tokens.push({ type: 'key', name: arrayMatch[1] })
      tokens.push({ type: 'array', selector: arrayMatch[2] })
      continue
    }

    tokens.push({ type: 'key', name: part })
  }

  return tokens
}

function resolveArrayItem(array: unknown[], selector: string): Record<string, unknown> | null {
  const byId = array.find(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      String((item as { id?: string | null }).id ?? '') === selector,
  )

  if (byId && typeof byId === 'object') {
    return byId as Record<string, unknown>
  }

  const index = Number(selector)
  if (Number.isInteger(index) && index >= 0 && index < array.length) {
    const item = array[index]
    if (item && typeof item === 'object') return item as Record<string, unknown>
  }

  return null
}

export function collectLocalizedStrings(
  data: Record<string, unknown> | null | undefined,
  fieldPath: string,
): LocalizedStringField[] {
  if (!data) return []

  const segments = parseFieldPath(fieldPath)
  return walkCollect(data, segments, '')
}

function walkCollect(
  node: unknown,
  segments: Array<string | '[]'>,
  pathPrefix: string,
): LocalizedStringField[] {
  if (segments.length === 0) return []

  const [head, ...rest] = segments

  if (head === '[]') {
    if (!Array.isArray(node)) return []

    const results: LocalizedStringField[] = []
    for (let index = 0; index < node.length; index++) {
      const item = node[index]
      if (!item || typeof item !== 'object') continue

      const selector = arraySelector(item, index)
      const parentPath = pathPrefix ? `${pathPrefix}[${selector}]` : `[${selector}]`
      results.push(...walkCollect(item, rest, parentPath))
    }

    return results
  }

  if (!node || typeof node !== 'object' || Array.isArray(node)) return []

  const record = node as Record<string, unknown>
  const nextNode = record[head]
  const nextPrefix = pathPrefix ? `${pathPrefix}.${head}` : head

  if (rest.length === 0) {
    if (typeof nextNode !== 'string') return []
    const value = nextNode.trim()
    return value ? [{ path: nextPrefix, value }] : []
  }

  return walkCollect(nextNode, rest, nextPrefix)
}

export function collectLocalizedRichText(
  data: Record<string, unknown> | null | undefined,
  fieldPath: string,
): LocalizedRichTextField[] {
  if (!data) return []

  const segments = parseFieldPath(fieldPath)
  return walkCollectRichText(data, segments, '')
}

function walkCollectRichText(
  node: unknown,
  segments: Array<string | '[]'>,
  pathPrefix: string,
): LocalizedRichTextField[] {
  if (segments.length === 0) return []

  const [head, ...rest] = segments

  if (head === '[]') {
    if (!Array.isArray(node)) return []

    const results: LocalizedRichTextField[] = []
    for (let index = 0; index < node.length; index++) {
      const item = node[index]
      if (!item || typeof item !== 'object') continue

      const selector = arraySelector(item, index)
      const parentPath = pathPrefix ? `${pathPrefix}[${selector}]` : `[${selector}]`
      results.push(...walkCollectRichText(item, rest, parentPath))
    }

    return results
  }

  if (!node || typeof node !== 'object' || Array.isArray(node)) return []

  const record = node as Record<string, unknown>
  const nextNode = record[head]
  const nextPrefix = pathPrefix ? `${pathPrefix}.${head}` : head

  if (rest.length === 0) {
    if (!isLexicalRichText(nextNode)) return []
    return [{ path: nextPrefix, value: nextNode }]
  }

  return walkCollectRichText(nextNode, rest, nextPrefix)
}

/**
 * Walk one path token while preparing to set a value.
 * When the next token is an array selector, preserves existing arrays
 * instead of replacing them with `{}` (which broke stats[].label patches).
 */
function descendForSet(
  current: unknown,
  token: PathToken,
  nextToken: PathToken | undefined,
): unknown | null {
  if (token.type === 'key') {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return null

    const record = current as Record<string, unknown>
    const existing = record[token.name]

    if (nextToken?.type === 'array') {
      if (Array.isArray(existing)) return existing

      if (existing == null) {
        const created: Record<string, unknown>[] = []
        record[token.name] = created
        return created
      }

      return null
    }

    if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
      return existing
    }

    if (Array.isArray(existing)) return null

    const created: Record<string, unknown> = {}
    record[token.name] = created
    return created
  }

  if (!Array.isArray(current)) return null

  const existingItem = resolveArrayItem(current, token.selector)
  if (existingItem) return existingItem

  const created: Record<string, unknown> = {}
  const asIndex = Number(token.selector)

  if (Number.isInteger(asIndex) && asIndex >= 0 && String(asIndex) === token.selector) {
    while (current.length < asIndex) {
      current.push({})
    }
    current[asIndex] = created
  } else {
    created.id = token.selector
    current.push(created)
  }

  return created
}

function setAtCanonicalPath(
  root: Record<string, unknown>,
  canonicalPath: string,
  value: unknown,
): boolean {
  const tokens = tokenizeCanonicalPath(canonicalPath)
  if (tokens.length === 0) return false

  let current: unknown = root

  for (let index = 0; index < tokens.length - 1; index++) {
    const next = descendForSet(current, tokens[index], tokens[index + 1])
    if (next == null) return false
    current = next
  }

  const last = tokens[tokens.length - 1]
  if (last.type !== 'key' || !current || typeof current !== 'object' || Array.isArray(current)) {
    return false
  }

  ;(current as Record<string, unknown>)[last.name] = value
  return true
}

export function setLocalizedString(
  root: Record<string, unknown>,
  canonicalPath: string,
  value: string,
): boolean {
  return setAtCanonicalPath(root, canonicalPath, value)
}

export function setLocalizedRichText(
  root: Record<string, unknown>,
  canonicalPath: string,
  value: Record<string, unknown>,
): boolean {
  return setAtCanonicalPath(root, canonicalPath, value)
}

export function indexLocalizedStrings(
  fields: LocalizedStringField[],
): Map<string, string> {
  return new Map(fields.map((field) => [field.path, field.value]))
}
