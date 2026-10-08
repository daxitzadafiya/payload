import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  GlobalAfterChangeHook,
  GlobalConfig,
  PayloadRequest,
} from 'payload'

import { isAutoTranslating } from '@/utilities/autoTranslate/context'

import { ACTIVITY_LOGS_SLUG, type AuditAction, type FieldChange } from './constants'
import { diffDocuments } from './diffDocuments'
import { buildChangesSummary } from './humanizeFieldPath'
import { inferSoftDeleteAuditAction } from './inferSoftDeleteAuditAction'
import { maskFieldChanges } from './maskSensitive'
import { resolveActor, resolveLocale, resolveLocaleLabel } from './resolveActor'
import { resolveDocumentTitle, resolveModule, resolveSection } from './resolveModule'

type WriteAuditLogArgs = {
  req: PayloadRequest
  action: AuditAction
  module: ReturnType<typeof resolveModule>
  section: string
  documentId: string
  documentTitle: string
  changes: FieldChange[]
}

/** Serialize for textarea storage — Payload json fields reject plain strings. */
export function serializeChangeValue(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

async function writeAuditLog({
  req,
  action,
  module,
  section,
  documentId,
  documentTitle,
  changes,
}: WriteAuditLogArgs): Promise<void> {
  // Skip empty updates (e.g. save with no field changes)
  if (action === 'update' && changes.length === 0) return

  const { updatedBy, actorLabel } = resolveActor(req)
  const locale = resolveLocale(req)
  const serializedChanges = maskFieldChanges(changes).map((c) => ({
    field: c.field,
    oldValue: serializeChangeValue(c.oldValue),
    newValue: serializeChangeValue(c.newValue),
  }))

  try {
    await req.payload.create({
      collection: ACTIVITY_LOGS_SLUG,
      data: {
        action,
        module,
        section,
        documentId,
        documentTitle: documentTitle || section,
        locale,
        localeLabel: resolveLocaleLabel(locale),
        actorLabel,
        ...(updatedBy !== undefined ? { updatedBy } : {}),
        timestamp: new Date().toISOString(),
        changesSummary: buildChangesSummary(serializedChanges),
        changes: serializedChanges,
      },
      req,
      overrideAccess: true,
      context: {
        skipAuditLog: true,
      },
      depth: 0,
    })
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: `[auditLog] Failed to write activity log for ${module}/${section} (${action})`,
    })
  }
}

function asDoc(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function shouldSkipAudit(context: Record<string, unknown> | undefined): boolean {
  if (context?.skipAuditLog) return true
  // DeepL / background locale fills have no authenticated actor — skip noise
  if (isAutoTranslating(context)) return true
  return false
}

export function createCollectionAuditAfterChange(
  collection: CollectionConfig,
): CollectionAfterChangeHook {
  const module = resolveModule(collection, 'collection')
  const section = resolveSection(collection)
  const useAsTitle = collection.admin?.useAsTitle

  return async ({ doc, previousDoc, operation, req, context }) => {
    if (shouldSkipAudit(context as Record<string, unknown>)) return doc

    const next = asDoc(doc)
    const prev = operation === 'create' ? null : asDoc(previousDoc)
    const changes = diffDocuments(prev, next)
    const softAction =
      operation === 'create' ? null : inferSoftDeleteAuditAction(prev, next, changes)
    const action: AuditAction =
      operation === 'create' ? 'create' : softAction ?? 'update'

    await writeAuditLog({
      req,
      action,
      module,
      section,
      documentId: String(next?.id ?? ''),
      documentTitle: resolveDocumentTitle(next, useAsTitle, section),
      changes,
    })

    return doc
  }
}

export function createCollectionAuditAfterDelete(
  collection: CollectionConfig,
): CollectionAfterDeleteHook {
  const module = resolveModule(collection, 'collection')
  const section = resolveSection(collection)
  const useAsTitle = collection.admin?.useAsTitle

  return async ({ doc, req, context }) => {
    if (shouldSkipAudit(context as Record<string, unknown>)) return doc

    const prev = asDoc(doc)
    const changes = diffDocuments(prev, null)

    await writeAuditLog({
      req,
      action: 'delete',
      module,
      section,
      documentId: String(prev?.id ?? ''),
      documentTitle: resolveDocumentTitle(prev, useAsTitle, section),
      changes,
    })

    return doc
  }
}

export function createGlobalAuditAfterChange(global: GlobalConfig): GlobalAfterChangeHook {
  const module = resolveModule(global, 'global')
  const section = resolveSection(global)

  return async ({ doc, previousDoc, req, context }) => {
    if (shouldSkipAudit(context as Record<string, unknown>)) return doc

    const next = asDoc(doc)
    const prev = asDoc(previousDoc)
    // Globals have no `operation` on afterChange — treat missing previous as create.
    const isCreate = !prev || Object.keys(prev).length === 0
    const changes = diffDocuments(isCreate ? null : prev, next)
    const softAction = isCreate ? null : inferSoftDeleteAuditAction(prev, next, changes)
    const action: AuditAction = isCreate ? 'create' : softAction ?? 'update'

    await writeAuditLog({
      req,
      action,
      module,
      section,
      documentId: global.slug,
      documentTitle: section,
      changes,
    })

    return doc
  }
}

/** Convenience re-export for consumers that want a named hook utility. */
export const auditLogHook = {
  createCollectionAuditAfterChange,
  createCollectionAuditAfterDelete,
  createGlobalAuditAfterChange,
}
