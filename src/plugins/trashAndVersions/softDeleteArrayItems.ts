import type {
  GlobalAfterChangeHook,
  GlobalAfterReadHook,
  GlobalBeforeChangeHook,
} from 'payload'

import type { SoftDeleteFieldSpec } from './softDeleteConfig'

export type SoftDeletableItem = {
  id?: string | null
  isDeleted?: boolean | null
  deletedAt?: string | null
  subLinks?: SoftDeletableItem[] | null
  link?: { label?: string | null } | null
  [key: string]: unknown
}

export const INCLUDE_SOFT_DELETED_ITEMS = 'includeSoftDeletedItems' as const
export const RESTORE_ARRAY_ITEM = 'restoreArrayItem' as const
export const SKIP_ARRAY_ITEM_SOFT_DELETE = 'skipArrayItemSoftDelete' as const
/** Snapshot of array rows the editor submitted (before soft-deleted rows were re-appended). */
export const SUBMITTED_SOFT_DELETE_ARRAYS = 'submittedSoftDeleteArrays' as const

function shouldIncludeSoftDeleted(context: Record<string, unknown> | undefined): boolean {
  return Boolean(
    context?.[INCLUDE_SOFT_DELETED_ITEMS] ||
      context?.includeSoftDeletedNavItems ||
      context?.restoreNavItem ||
      context?.[RESTORE_ARRAY_ITEM],
  )
}

function shouldSkipSoftDelete(context: Record<string, unknown> | undefined): boolean {
  return Boolean(
    context?.[SKIP_ARRAY_ITEM_SOFT_DELETE] ||
      context?.skipNavItemSoftDelete ||
      context?.[RESTORE_ARRAY_ITEM] ||
      context?.restoreNavItem,
  )
}

/**
 * Payload's local API merges `context` onto the parent `req.context`.
 * Clear soft-delete include flags so later afterRead/afterChange still strip rows.
 */
export function clearIncludeSoftDeletedFlag(req: { context?: Record<string, unknown> }): void {
  if (!req.context) return
  delete req.context[INCLUDE_SOFT_DELETED_ITEMS]
  delete req.context.includeSoftDeletedNavItems
}

function softDeleteRemoved(
  previous: SoftDeletableItem[] | null | undefined,
  next: SoftDeletableItem[] | null | undefined,
  nestedKey?: string,
): SoftDeletableItem[] {
  const current = Array.isArray(next) ? next : []
  const prev = Array.isArray(previous) ? previous : []
  const now = new Date().toISOString()

  const currentById = new Map(
    current.filter((item) => item?.id).map((item) => [String(item.id), item]),
  )
  const prevById = new Map(prev.filter((item) => item?.id).map((item) => [String(item.id), item]))

  const active = current.map((item) => {
    const matchedPrev = item?.id ? prevById.get(String(item.id)) : undefined
    const withNested =
      nestedKey && Array.isArray(item[nestedKey])
        ? {
            ...item,
            [nestedKey]: softDeleteRemoved(
              (matchedPrev?.[nestedKey] as SoftDeletableItem[] | undefined) || [],
              item[nestedKey] as SoftDeletableItem[],
            ),
          }
        : item

    return {
      ...withNested,
      isDeleted: false,
      deletedAt: null,
    }
  })

  // Keep soft-deleted rows at their original index so restore returns them in place.
  const softDeletedAtIndex: { index: number; item: SoftDeletableItem }[] = []
  for (let index = 0; index < prev.length; index++) {
    const item = prev[index]
    if (!item?.id) continue
    if (currentById.has(String(item.id))) continue

    const withNested =
      nestedKey && Array.isArray(item[nestedKey])
        ? {
            ...item,
            [nestedKey]: softDeleteRemoved(
              item[nestedKey] as SoftDeletableItem[],
              item[nestedKey] as SoftDeletableItem[],
            ),
          }
        : item

    softDeletedAtIndex.push({
      index,
      item: {
        ...withNested,
        isDeleted: true,
        deletedAt: item.deletedAt || now,
      },
    })
  }

  const result: SoftDeletableItem[] = [...active]
  for (const entry of softDeletedAtIndex) {
    const insertAt = Math.min(entry.index, result.length)
    result.splice(insertAt, 0, entry.item)
  }

  return result
}

function stripDeleted(
  items: SoftDeletableItem[] | null | undefined,
  nestedKey?: string,
): SoftDeletableItem[] | null | undefined {
  if (!Array.isArray(items)) return items
  return items
    .filter((item) => !item?.isDeleted)
    .map((item) => {
      if (!nestedKey || !Array.isArray(item[nestedKey])) return item
      return {
        ...item,
        [nestedKey]: stripDeleted(item[nestedKey] as SoftDeletableItem[], nestedKey),
      }
    })
}

function textFromLabel(label: unknown, locale?: string): string {
  if (typeof label === 'string' && label.trim()) return label.trim()
  if (label && typeof label === 'object' && !Array.isArray(label) && locale && locale !== 'all') {
    const current = (label as Record<string, unknown>)[locale]
    if (typeof current === 'string' && current.trim()) return current.trim()
  }
  return ''
}

function submittedLabelForResponse(
  submittedLabel: unknown,
  savedLabel: unknown,
  locale?: string,
): unknown {
  // Field hooks persist the real label. The submitted snapshot is captured in
  // global beforeChange *before* those hooks, so a locale map here is often stale
  // ("1 Guest" while the editor saved "1 people"). Prefer what was saved.
  const savedText = textFromLabel(savedLabel, locale)
  if (savedText) return savedText
  const submittedText = textFromLabel(submittedLabel, locale)
  if (submittedText) return submittedText
  return savedLabel
}

/** Keep only rows the editor submitted (plus nested), matching a page refresh. */
function filterToSubmitted(
  items: SoftDeletableItem[] | null | undefined,
  submitted: SoftDeletableItem[] | null | undefined,
  nestedKey?: string,
  locale?: string,
): SoftDeletableItem[] {
  if (!Array.isArray(items)) return []
  if (!Array.isArray(submitted)) {
    return (stripDeleted(items, nestedKey) as SoftDeletableItem[]) || []
  }

  const submittedById = new Map(
    submitted.filter((item) => item?.id).map((item) => [String(item.id), item]),
  )

  return items
    .filter((item) => item?.id && submittedById.has(String(item.id)))
    .map((item) => {
      const submittedItem = submittedById.get(String(item.id))
      const withLabel =
        submittedItem && ('label' in submittedItem || 'label' in item)
          ? {
              ...item,
              label: submittedLabelForResponse(submittedItem.label, item.label, locale),
            }
          : item

      if (!nestedKey || !Array.isArray(withLabel[nestedKey])) {
        return { ...withLabel, isDeleted: false, deletedAt: null }
      }
      return {
        ...withLabel,
        isDeleted: false,
        deletedAt: null,
        [nestedKey]: filterToSubmitted(
          withLabel[nestedKey] as SoftDeletableItem[],
          submittedItem?.[nestedKey] as SoftDeletableItem[] | undefined,
          nestedKey,
          locale,
        ),
      }
    })
}

export function restoreItemById(
  items: SoftDeletableItem[] | null | undefined,
  itemId: string,
  nestedKeys: string[] = [],
): { items: SoftDeletableItem[]; found: boolean } {
  if (!Array.isArray(items)) return { items: items || [], found: false }

  let found = false
  const nestedKey = nestedKeys[0]
  const deeperNested = nestedKeys.slice(1)

  const next = items.map((item) => {
    if (item.id === itemId) {
      found = true
      return { ...item, isDeleted: false, deletedAt: null }
    }

    if (nestedKey && Array.isArray(item[nestedKey])) {
      const nested = restoreItemById(
        item[nestedKey] as SoftDeletableItem[],
        itemId,
        deeperNested.length ? deeperNested : nestedKeys,
      )
      if (nested.found) {
        found = true
        return { ...item, [nestedKey]: nested.items }
      }
    }

    return item
  })

  return { items: next, found }
}

/**
 * Ensure required localized `label` exists for every locale.
 * Prevents restore/save validation failures when some locale rows were wiped.
 */
export function fillLocalizedLabels(
  items: SoftDeletableItem[] | null | undefined,
  locales: readonly string[],
  defaultLocale = 'en',
): SoftDeletableItem[] {
  if (!Array.isArray(items)) return []

  return items.map((item) => {
    const fallbackFromValue =
      (typeof item.value === 'string' && item.value.trim()) ||
      (typeof item.family === 'string' && item.family.trim()) ||
      String(item.id || 'Item')

    let label = item.label as string | Record<string, string | null | undefined> | null | undefined

    if (typeof label === 'string') {
      const text = label.trim() || fallbackFromValue
      label = Object.fromEntries(locales.map((locale) => [locale, text]))
    } else if (label && typeof label === 'object') {
      const record = { ...label }
      const fallback =
        (typeof record[defaultLocale] === 'string' && record[defaultLocale]!.trim()) ||
        Object.values(record).find((value) => typeof value === 'string' && value.trim()) ||
        fallbackFromValue

      for (const locale of locales) {
        const current = record[locale]
        if (typeof current !== 'string' || !current.trim()) {
          record[locale] = String(fallback)
        }
      }
      label = record
    } else {
      label = Object.fromEntries(locales.map((locale) => [locale, fallbackFromValue]))
    }

    return {
      ...item,
      label,
    }
  })
}

/**
 * Fill empty labels from `value` without expanding a single-locale string into
 * every locale (that would overwrite translations on a normal admin save).
 */
export function ensureArrayOptionLabels(
  items: SoftDeletableItem[] | null | undefined,
): SoftDeletableItem[] {
  if (!Array.isArray(items)) return []

  return items.map((item) => {
    const fallbackFromValue =
      (typeof item.value === 'string' && item.value.trim()) ||
      (typeof item.family === 'string' && item.family.trim()) ||
      ''
    const fallback = fallbackFromValue
      ? fallbackFromValue.charAt(0).toUpperCase() + fallbackFromValue.slice(1)
      : 'Option'

    const label = item.label as string | Record<string, string | null | undefined> | null | undefined

    if (typeof label === 'string') {
      return { ...item, label: label.trim() || fallback }
    }

    if (label && typeof label === 'object') {
      const record = { ...label }
      for (const [locale, current] of Object.entries(record)) {
        if (typeof current !== 'string' || !current.trim()) {
          record[locale] = fallback
        }
      }
      return { ...item, label: record }
    }

    return { ...item, label: fallback }
  })
}

function resolveFindLocale(spec: SoftDeleteFieldSpec, reqLocale: string | undefined) {
  if (spec.localized) return reqLocale
  if (spec.hasLocalizedFields) return 'all'
  return undefined
}

/** Keep removed array rows as soft-deleted instead of hard-deleting them. */
export function createGlobalSoftDeleteBeforeChange(
  specs: SoftDeleteFieldSpec[],
): GlobalBeforeChangeHook {
  return async ({ data, originalDoc, global, req, context }) => {
    if (!data || specs.length === 0) return data
    if (shouldSkipSoftDelete(context as Record<string, unknown>)) return data

    const record = data as Record<string, SoftDeletableItem[] | undefined>
    const original = originalDoc as Record<string, SoftDeletableItem[] | undefined> | undefined
    const ctx = context as Record<string, unknown>
    const submittedSnapshots: Record<string, SoftDeletableItem[]> = {
      ...((ctx[SUBMITTED_SOFT_DELETE_ARRAYS] as Record<string, SoftDeletableItem[]>) || {}),
    }

    // findGlobal({ locale: 'all', req }) mutates this same request to locale
    // 'all'. mergeLocaleActions then ignores the field-hook return and writes
    // the old locale map — Spanish/admin edits look like they snap back.
    const contentLocale = req.locale
    const contentFallbackLocale = req.fallbackLocale

    for (const spec of specs) {
      if (!Object.prototype.hasOwnProperty.call(data, spec.field)) continue

      // Capture what the editor actually submitted before we re-append soft-deleted rows.
      if (Array.isArray(record[spec.field])) {
        submittedSnapshots[spec.field] = structuredClone(record[spec.field]) as SoftDeletableItem[]
      }

      let previous = original?.[spec.field]

      try {
        const full = await req.payload.findGlobal({
          slug: global.slug as never,
          depth: 0,
          locale: resolveFindLocale(
            spec,
            typeof contentLocale === 'string' ? contentLocale : undefined,
          ) as never,
          fallbackLocale: false,
          req,
          overrideAccess: true,
          context: { [INCLUDE_SOFT_DELETED_ITEMS]: true },
        })
        previous =
          (full as Record<string, SoftDeletableItem[] | undefined>)[spec.field] ?? previous
      } catch {
        // keep previous from originalDoc
      } finally {
        req.locale = contentLocale
        req.fallbackLocale = contentFallbackLocale
        // Local API merges context onto the parent req — clear so save response can strip.
        clearIncludeSoftDeletedFlag(req)
      }

      // When previous was loaded with locale:'all', merge localized label objects onto
      // soft-deleted rows so a single-locale save does not wipe other locales.
      record[spec.field] = softDeleteRemoved(
        previous,
        record[spec.field],
        spec.nested?.[0],
      )

      if (spec.hasLocalizedFields && Array.isArray(record[spec.field])) {
        record[spec.field] = ensureArrayOptionLabels(record[spec.field])
      }
    }

    ctx[SUBMITTED_SOFT_DELETE_ARRAYS] = submittedSnapshots
    return data
  }
}

/** Hide soft-deleted rows in admin/API unless explicitly requested. */
export function createGlobalSoftDeleteAfterRead(
  specs: SoftDeleteFieldSpec[],
): GlobalAfterReadHook {
  return ({ doc, context }) => {
    if (!doc || shouldIncludeSoftDeleted(context as Record<string, unknown>)) return doc

    const record = doc as Record<string, SoftDeletableItem[] | undefined>
    for (const spec of specs) {
      if (Array.isArray(record[spec.field])) {
        record[spec.field] = stripDeleted(record[spec.field], spec.nested?.[0]) as SoftDeletableItem[]
      }
    }

    return doc
  }
}

/**
 * Ensure the save response matches a page refresh: only rows the editor kept.
 * Soft-deleted rows stay in the DB / Globals Trash, but must not reappear in the form.
 */
export function createGlobalSoftDeleteAfterChange(
  specs: SoftDeleteFieldSpec[],
): GlobalAfterChangeHook {
  return ({ doc, req, context }) => {
    if (!doc || specs.length === 0) return doc
    if (context?.[RESTORE_ARRAY_ITEM] || context?.restoreNavItem) return doc

    const record = doc as Record<string, SoftDeletableItem[] | undefined>
    const submittedSnapshots =
      (context?.[SUBMITTED_SOFT_DELETE_ARRAYS] as Record<string, SoftDeletableItem[]> | undefined) ||
      {}
    const locale = typeof req?.locale === 'string' ? req.locale : undefined

    for (const spec of specs) {
      if (!Array.isArray(record[spec.field])) continue

      if (Object.prototype.hasOwnProperty.call(submittedSnapshots, spec.field)) {
        record[spec.field] = filterToSubmitted(
          record[spec.field],
          submittedSnapshots[spec.field],
          spec.nested?.[0],
          locale,
        )
      } else {
        record[spec.field] = stripDeleted(
          record[spec.field],
          spec.nested?.[0],
        ) as SoftDeletableItem[]
      }
    }

    return doc
  }
}

export function collectTrashedArrayItems(args: {
  fieldLabel: string
  fieldPath: string
  globalLabel: string
  globalSlug: string
  items: SoftDeletableItem[] | null | undefined
  labelFrom: (item: SoftDeletableItem) => string
  locale?: string
  nestedKeys?: string[]
}): {
  deletedAt: string
  fieldLabel: string
  fieldPath: string
  globalLabel: string
  globalSlug: string
  itemId: string
  label: string
  locale?: string
}[] {
  const rows: ReturnType<typeof collectTrashedArrayItems> = []
  const nestedKey = args.nestedKeys?.[0]

  const walk = (items: SoftDeletableItem[] | undefined, path: string) => {
    for (const item of items || []) {
      if (!item?.id) continue
      if (item.isDeleted) {
        rows.push({
          globalSlug: args.globalSlug,
          globalLabel: args.globalLabel,
          fieldPath: args.fieldPath,
          fieldLabel: args.fieldLabel,
          itemId: item.id,
          locale: args.locale,
          label: args.labelFrom(item),
          deletedAt: item.deletedAt || new Date(0).toISOString(),
        })
      }
      if (nestedKey && Array.isArray(item[nestedKey])) {
        walk(item[nestedKey] as SoftDeletableItem[], `${path}/${item.id}/${nestedKey}`)
      }
    }
  }

  walk(args.items || [], args.fieldPath)
  return rows
}

/** @deprecated use createGlobalSoftDeleteBeforeChange */
export function createSoftDeleteArrayBeforeChange(fieldName: 'navItems'): GlobalBeforeChangeHook {
  return createGlobalSoftDeleteBeforeChange([
    {
      field: fieldName,
      nested: ['subLinks'],
      fieldLabel: 'Nav item',
      localized: true,
      labelFrom: (item) => {
        const link = item.link as { label?: string | null } | undefined
        return link?.label || String(item.id || 'Item')
      },
    },
  ])
}

/** @deprecated use createGlobalSoftDeleteAfterRead */
export function createSoftDeleteArrayAfterRead(fieldName: 'navItems'): GlobalAfterReadHook {
  return createGlobalSoftDeleteAfterRead([
    {
      field: fieldName,
      nested: ['subLinks'],
      fieldLabel: 'Nav item',
      localized: true,
      labelFrom: (item) => {
        const link = item.link as { label?: string | null } | undefined
        return link?.label || String(item.id || 'Item')
      },
    },
  ])
}

/** @deprecated use collectTrashedArrayItems */
export function collectTrashedNavItems(args: {
  globalSlug: string
  globalLabel: string
  locale: string
  items: SoftDeletableItem[] | null | undefined
}) {
  return collectTrashedArrayItems({
    ...args,
    fieldPath: 'navItems',
    fieldLabel: 'Nav item',
    labelFrom: (item) => {
      const link = item.link as { label?: string | null } | undefined
      return link?.label || String(item.id || 'Item')
    },
    nestedKeys: ['subLinks'],
  })
}
