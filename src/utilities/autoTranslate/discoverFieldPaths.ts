import type { Block, Field, Tab } from 'payload'

/** Localized URLs should not be sent to DeepL. */
const SKIPPED_FIELD_NAMES = new Set(['url', 'slug'])

export type LocalizedFieldKind = 'string' | 'richtext'

export type DiscoveredFieldPath = {
  path: string
  kind: LocalizedFieldKind
}

type StringField = Field & { name: string; type: 'text' | 'textarea' }
type RichTextField = Field & { name: string; type: 'richText' }

function isTranslatableStringField(field: Field): field is StringField {
  return (
    (field.type === 'text' || field.type === 'textarea') &&
    field.localized === true &&
    typeof field.name === 'string' &&
    field.name.length > 0 &&
    !SKIPPED_FIELD_NAMES.has(field.name)
  )
}

function isTranslatableRichTextField(field: Field): field is RichTextField {
  return (
    field.type === 'richText' &&
    field.localized === true &&
    typeof field.name === 'string' &&
    field.name.length > 0
  )
}

function collectFromTabs(tabs: Tab[] | undefined, prefix: string): DiscoveredFieldPath[] {
  if (!tabs?.length) return []

  return tabs.flatMap((tab) => {
    const tabPrefix =
      'name' in tab && typeof tab.name === 'string' && tab.name.length > 0
        ? prefix
          ? `${prefix}.${tab.name}`
          : tab.name
        : prefix

    return discoverLocalizedFields(tab.fields ?? [], tabPrefix)
  })
}

/**
 * Walk a Payload field tree and collect localized string + richText field paths.
 * Arrays use `[]` (e.g. `stats[].label`, `sections[].body`).
 */
export function discoverLocalizedFields(
  fields: Field[] | undefined,
  prefix = '',
): DiscoveredFieldPath[] {
  if (!fields?.length) return []

  const paths: DiscoveredFieldPath[] = []

  for (const field of fields) {
    if (!field || typeof field !== 'object' || !('type' in field)) continue

    if (isTranslatableStringField(field)) {
      paths.push({
        path: prefix ? `${prefix}.${field.name}` : field.name,
        kind: 'string',
      })
      continue
    }

    if (isTranslatableRichTextField(field)) {
      paths.push({
        path: prefix ? `${prefix}.${field.name}` : field.name,
        kind: 'richtext',
      })
      continue
    }

    switch (field.type) {
      case 'array': {
        if (!field.name || !field.fields) break
        const nextPrefix = prefix ? `${prefix}.${field.name}[]` : `${field.name}[]`
        paths.push(...discoverLocalizedFields(field.fields, nextPrefix))
        break
      }
      case 'group': {
        if (!('name' in field) || !field.name || !field.fields) break
        const nextPrefix = prefix ? `${prefix}.${field.name}` : field.name
        paths.push(...discoverLocalizedFields(field.fields, nextPrefix))
        break
      }
      case 'row':
      case 'collapsible': {
        paths.push(...discoverLocalizedFields(field.fields, prefix))
        break
      }
      case 'tabs': {
        paths.push(...collectFromTabs(field.tabs, prefix))
        break
      }
      default:
        break
    }
  }

  return paths
}

export function discoverLocalizedFieldPaths(fields: Field[] | undefined, prefix = ''): string[] {
  return discoverLocalizedFields(fields, prefix)
    .filter((field) => field.kind === 'string')
    .map((field) => field.path)
}

export type BlockFieldRegistry = {
  strings: readonly string[]
  richText: readonly string[]
}

export function buildBlockFieldPathRegistry(
  blocks: readonly Block[],
): Record<string, BlockFieldRegistry> {
  const registry: Record<string, BlockFieldRegistry> = {}

  for (const block of blocks) {
    const discovered = discoverLocalizedFields(block.fields)
    registry[block.slug] = {
      strings: discovered.filter((field) => field.kind === 'string').map((field) => field.path),
      richText: discovered.filter((field) => field.kind === 'richtext').map((field) => field.path),
    }
  }

  return registry
}
