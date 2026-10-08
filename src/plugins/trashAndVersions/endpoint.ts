import type { Endpoint, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { defaultLocale, localeCodes } from '@/i18n/locales'

import {
  getSoftDeleteSpecsForGlobal,
  GLOBAL_SOFT_DELETE_FIELDS,
  type SoftDeleteFieldSpec,
} from './softDeleteConfig'
import {
  clearIncludeSoftDeletedFlag,
  collectTrashedArrayItems,
  fillLocalizedLabels,
  INCLUDE_SOFT_DELETED_ITEMS,
  RESTORE_ARRAY_ITEM,
  restoreItemById,
  SKIP_ARRAY_ITEM_SOFT_DELETE,
  type SoftDeletableItem,
} from './softDeleteArrayItems'

type Body = {
  action?: 'restoreItem' | 'restoreNavItem'
  fieldPath?: string
  itemId?: string
  locale?: string
  slug?: string
}

async function readBody(req: PayloadRequest): Promise<Body> {
  if (req.json && typeof req.json === 'function') {
    try {
      return (await req.json()) as Body
    } catch {
      return {}
    }
  }
  return (req.data as Body) || {}
}

function resolveGlobalLabel(label: unknown, slug: string): string {
  if (typeof label === 'string') return label
  if (label && typeof label === 'object') {
    const record = label as Record<string, string>
    return record.en || Object.values(record)[0] || slug
  }
  return slug
}

function collectFromDoc(args: {
  doc: Record<string, unknown>
  globalLabel: string
  globalSlug: string
  locale?: string
  specs: SoftDeleteFieldSpec[]
}) {
  const rows: ReturnType<typeof collectTrashedArrayItems> = []

  for (const spec of args.specs) {
    rows.push(
      ...collectTrashedArrayItems({
        globalSlug: args.globalSlug,
        globalLabel: args.globalLabel,
        fieldPath: spec.field,
        fieldLabel: spec.fieldLabel,
        locale: args.locale,
        items: args.doc[spec.field] as SoftDeletableItem[] | undefined,
        labelFrom: spec.labelFrom,
        nestedKeys: spec.nested,
      }),
    )
  }

  return rows
}

export async function listTrashedItemsForGlobals(req: PayloadRequest) {
  const rows: ReturnType<typeof collectTrashedArrayItems> = []

  for (const globalSlug of Object.keys(GLOBAL_SOFT_DELETE_FIELDS)) {
    const globalConfig = req.payload.config.globals?.find((global) => global.slug === globalSlug)
    if (!globalConfig) continue

    const globalLabel = resolveGlobalLabel(globalConfig.label, globalSlug)
    const specs = getSoftDeleteSpecsForGlobal(globalSlug)
    const localizedSpecs = specs.filter((spec) => spec.localized)
    const globalSpecs = specs.filter((spec) => !spec.localized)

    if (globalSpecs.length > 0) {
      try {
        const doc = await req.payload.findGlobal({
          slug: globalSlug as never,
          depth: 0,
          req,
          overrideAccess: false,
          user: req.user,
          context: { [INCLUDE_SOFT_DELETED_ITEMS]: true },
        })

        rows.push(
          ...collectFromDoc({
            doc: doc as Record<string, unknown>,
            globalSlug,
            globalLabel,
            specs: globalSpecs,
          }),
        )
      } catch {
        // skip globals the user cannot read
      }
    }

    if (localizedSpecs.length === 0) continue

    for (const locale of localeCodes) {
      try {
        const doc = await req.payload.findGlobal({
          slug: globalSlug as never,
          depth: 0,
          locale: locale as never,
          fallbackLocale: false,
          req,
          overrideAccess: false,
          user: req.user,
          context: { [INCLUDE_SOFT_DELETED_ITEMS]: true },
        })

        rows.push(
          ...collectFromDoc({
            doc: doc as Record<string, unknown>,
            globalSlug,
            globalLabel,
            locale,
            specs: localizedSpecs,
          }),
        )
      } catch {
        // skip locales / access failures
      }
    }
  }

  return rows.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))
}

/** @deprecated use listTrashedItemsForGlobals */
export async function listTrashedNavItemsForGlobals(req: PayloadRequest) {
  return listTrashedItemsForGlobals(req)
}

export const globalsTrashEndpoint: Endpoint = {
  path: '/trash/globals',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Unauthorized', 401)
    }

    const body = await readBody(req)
    const slug = typeof body.slug === 'string' ? body.slug : ''
    const action = body.action === 'restoreNavItem' ? 'restoreItem' : body.action

    if (!slug) {
      throw new APIError('Invalid slug', 400)
    }

    const globalConfig = req.payload.config.globals?.find((global) => global.slug === slug)
    if (!globalConfig) {
      throw new APIError(`Global not found: ${slug}`, 404)
    }

    if (action !== 'restoreItem') {
      throw new APIError('Invalid action', 400)
    }

    const fieldPath = typeof body.fieldPath === 'string' ? body.fieldPath : 'navItems'
    const itemId = typeof body.itemId === 'string' ? body.itemId : ''
    const locale = typeof body.locale === 'string' ? body.locale : req.locale || 'en'

    if (!itemId) {
      throw new APIError('itemId is required', 400)
    }

    const spec = getSoftDeleteSpecsForGlobal(slug).find((entry) => entry.field === fieldPath)
    if (!spec) {
      throw new APIError(`Field does not support trash restore: ${fieldPath}`, 400)
    }

    const readLocale = spec.localized
      ? locale
      : spec.hasLocalizedFields
        ? 'all'
        : undefined

    const current = await req.payload.findGlobal({
      slug: slug as never,
      depth: 0,
      locale: readLocale as never,
      fallbackLocale: false,
      req,
      overrideAccess: false,
      context: { [INCLUDE_SOFT_DELETED_ITEMS]: true },
    })
    clearIncludeSoftDeletedFlag(req)

    const items = (current as Record<string, SoftDeletableItem[] | undefined>)[fieldPath]
    const restored = restoreItemById(items, itemId, spec.nested)
    if (!restored.found) {
      throw new APIError('Item not found in trash', 404)
    }

    // Localized labels must be present for every locale or Payload rejects the update.
    const itemsToSave = spec.hasLocalizedFields
      ? fillLocalizedLabels(restored.items, localeCodes, defaultLocale)
      : restored.items

    const doc = await req.payload.updateGlobal({
      slug: slug as never,
      data: { [fieldPath]: itemsToSave } as never,
      locale: readLocale as never,
      fallbackLocale: false,
      req,
      depth: 0,
      overrideAccess: false,
      context: {
        [INCLUDE_SOFT_DELETED_ITEMS]: true,
        [RESTORE_ARRAY_ITEM]: true,
        [SKIP_ARRAY_ITEM_SOFT_DELETE]: true,
        disableRevalidate: true,
        skipAutoTranslate: true,
      },
    })

    return Response.json({
      doc,
      message: 'Restored item',
    })
  },
}
