import type { CollectionConfig, GlobalConfig } from 'payload'

import {
  MCP_COLLECTION_SLUG,
  SETTINGS_GLOBAL_SLUGS,
  type AuditModule,
} from './constants'

function resolveLabel(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    for (const locale of ['en', 'en-US', 'en-GB']) {
      const v = record[locale]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
    for (const v of Object.values(record)) {
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
  }
  return undefined
}

function humanizeSlug(slug: string): string {
  return slug
    .replace(/^payload-/, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

export function resolveModule(
  entity: Pick<CollectionConfig, 'slug' | 'admin'> | Pick<GlobalConfig, 'slug' | 'admin'>,
  kind: 'collection' | 'global',
): AuditModule {
  const slug = entity.slug
  if (slug === MCP_COLLECTION_SLUG) return 'MCP'
  if (SETTINGS_GLOBAL_SLUGS.has(slug)) return 'Settings'

  const groupLabel = resolveLabel(entity.admin?.group)
  if (groupLabel === 'MCP') return 'MCP'
  if (groupLabel === 'Settings') return 'Settings'

  return kind === 'collection' ? 'Collections' : 'Globals'
}

export function resolveSection(
  entity:
    | Pick<CollectionConfig, 'slug' | 'labels'>
    | Pick<GlobalConfig, 'slug' | 'label'>,
): string {
  if ('labels' in entity && entity.labels) {
    const plural = resolveLabel(entity.labels.plural)
    if (plural) return plural
    const singular = resolveLabel(entity.labels.singular)
    if (singular) return singular
  }
  if ('label' in entity && entity.label) {
    const label = resolveLabel(entity.label)
    if (label) return label
  }
  return humanizeSlug(entity.slug)
}

const TITLE_FALLBACKS = ['title', 'name', 'label', 'key', 'adminLabel', 'filename'] as const

export function resolveDocumentTitle(
  doc: Record<string, unknown> | null | undefined,
  useAsTitle?: string,
  fallback?: string,
): string {
  if (!doc) return fallback ?? ''

  if (useAsTitle) {
    const titled = doc[useAsTitle]
    if (typeof titled === 'string' && titled.trim()) return titled.trim()
    if (typeof titled === 'number') return String(titled)
  }

  for (const key of TITLE_FALLBACKS) {
    const v = doc[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }

  if (doc.id !== undefined && doc.id !== null) return String(doc.id)
  return fallback ?? ''
}
