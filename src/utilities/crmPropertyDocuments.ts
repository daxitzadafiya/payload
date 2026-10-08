/**
 * Resolve downloadable CRM documents (floor plans, quality specs, sales dossier, other).
 * Pedro Developments: documents with identification_type FP / QS / 128.
 */

import { buildPropertyAttachmentImageUrl, type PropertyAttachment } from '@/utilities/optimaImage'
import { getLocalizedText } from '@/utilities/localizedValue'

export type CRMPropertyDocumentKind =
  | 'floor_plan'
  | 'quality_specification'
  | 'sales_dossier'
  | 'other'

export type CRMPropertyDocumentGroup = {
  kind: CRMPropertyDocumentKind
  label: string
  urls: string[]
}

const FLOOR_PLAN_TYPES = new Set([
  'FP',
  '118',
  '119',
  '120',
  '121',
  '122',
  '123',
  '124',
  '125',
  '130',
  '133',
  '134',
  '135',
  '136',
  '137',
  '138',
  '139',
  '140',
  '141',
  '142',
  '143',
  '144',
  '145',
  '146',
  '147',
])

const DEFAULT_MODEL_BY_CONTEXT = {
  property: 'properties_images',
  construction: 'constructions_images',
} as const

function pickDocumentsArray(source: Record<string, unknown>): unknown[] {
  if (Array.isArray(source.documents)) return source.documents

  const nested = source.property
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const nestedDocs = (nested as Record<string, unknown>).documents
    if (Array.isArray(nestedDocs)) return nestedDocs
  }

  const raw = source._raw
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const rawRecord = raw as Record<string, unknown>
    if (Array.isArray(rawRecord.documents)) return rawRecord.documents
    const rawProperty = rawRecord.property
    if (rawProperty && typeof rawProperty === 'object' && !Array.isArray(rawProperty)) {
      const docs = (rawProperty as Record<string, unknown>).documents
      if (Array.isArray(docs)) return docs
    }
  }

  return []
}

function classifyDocument(identificationType: unknown): CRMPropertyDocumentKind {
  const key = identificationType == null ? '' : String(identificationType).trim()
  if (!key) return 'other'
  if (FLOOR_PLAN_TYPES.has(key) || FLOOR_PLAN_TYPES.has(key.toUpperCase())) return 'floor_plan'
  if (key === 'QS' || key.toUpperCase() === 'QS') return 'quality_specification'
  if (key === '128') return 'sales_dossier'
  return 'other'
}

function buildDocumentUrl(
  doc: Record<string, unknown>,
  fallbackModelName: string,
): string | undefined {
  if (typeof doc.url === 'string' && /^https?:\/\//i.test(doc.url.trim())) {
    return doc.url.trim()
  }

  const attachment: PropertyAttachment & Record<string, unknown> = {
    ...doc,
    model_name: doc.model_name || fallbackModelName,
    model_id: doc.model_id,
    file_md5_name: doc.file_md5_name,
  }

  const url = buildPropertyAttachmentImageUrl(attachment, 0)
  return url || undefined
}

function defaultLabelForKind(kind: CRMPropertyDocumentKind): string {
  switch (kind) {
    case 'floor_plan':
      return 'Floor plans'
    case 'quality_specification':
      return 'Quality report'
    case 'sales_dossier':
      return 'Sales file'
    default:
      return 'Documents'
  }
}

/**
 * Group published CRM documents for detail pages (property or project/construction).
 */
export function resolveCRMPropertyDocuments(
  source: Record<string, unknown>,
  options?: {
    locale?: string
    /** Prefer constructions_images for project detail. */
    context?: 'property' | 'construction'
  },
): CRMPropertyDocumentGroup[] {
  const locale = options?.locale ?? 'en'
  const fallbackModel =
    options?.context === 'construction'
      ? DEFAULT_MODEL_BY_CONTEXT.construction
      : DEFAULT_MODEL_BY_CONTEXT.property

  const docs = pickDocumentsArray(source)
  const buckets: Record<CRMPropertyDocumentKind, string[]> = {
    floor_plan: [],
    quality_specification: [],
    sales_dossier: [],
    other: [],
  }

  for (const item of docs) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const doc = item as Record<string, unknown>

    const published =
      doc.publish_status === undefined ||
      doc.publish_status === null ||
      doc.publish_status === 1 ||
      doc.publish_status === true ||
      doc.publish_status === '1'
    if (!published) continue

    const url = buildDocumentUrl(doc, fallbackModel)
    if (!url) continue

    const kind = classifyDocument(doc.identification_type)
    buckets[kind].push(url)
  }

  // Pedro also exposes pre-built arrays on formatted developments.
  for (const [kind, key] of [
    ['floor_plan', 'floor_plans'],
    ['quality_specification', 'quality_specifications'],
    ['sales_dossier', 'sales_dossier'],
  ] as const) {
    const prebuilt = source[key]
    if (!Array.isArray(prebuilt)) continue
    for (const entry of prebuilt) {
      if (typeof entry === 'string' && entry.trim()) {
        buckets[kind].push(entry.trim())
        continue
      }
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        const row = entry as Record<string, unknown>
        const url =
          (typeof row.url === 'string' && row.url.trim()) ||
          buildDocumentUrl(row, fallbackModel)
        if (url) buckets[kind].push(url)
      }
    }
  }

  const order: CRMPropertyDocumentKind[] = [
    'quality_specification',
    'sales_dossier',
    'floor_plan',
    'other',
  ]

  return order
    .map((kind) => {
      const urls = [...new Set(buckets[kind])]
      if (urls.length === 0) return null
      return {
        kind,
        label: defaultLabelForKind(kind),
        urls,
      } satisfies CRMPropertyDocumentGroup
    })
    .filter((group): group is CRMPropertyDocumentGroup => Boolean(group))
}

/** Localized display name helper when CRM provides description on a single file. */
export function resolveDocumentDisplayName(
  doc: Record<string, unknown>,
  locale: string,
  fallback: string,
): string {
  const description = getLocalizedText(doc.description, locale, '').trim()
  if (description) return description
  const fileName =
    (typeof doc.file_name === 'string' && doc.file_name.trim()) ||
    (typeof doc.name === 'string' && doc.name.trim()) ||
    ''
  return fileName || fallback
}
