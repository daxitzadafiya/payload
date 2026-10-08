import configPromise from '@payload-config'
import type { Config } from '@/payload-types'
import type { GlobalAfterChangeHook, Payload, PayloadRequest } from 'payload'
import { getPayload } from 'payload'

import { GLOBAL_DELETED_AT_FIELD } from '@/plugins/trashAndVersions/constants'
import { localeCodes } from '@/i18n/locales'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

import { enqueueAutoTranslate } from './autoTranslateQueue'
import { isAutoTranslating } from './context'
import {
  documentHasSourceTranslatableContent,
  documentLocalizedFieldsChanged,
  type DocumentFieldRegistry,
} from './documentTranslate'
import { resolveAutoTranslateSourceLocale } from './resolveSourceLocale'
import { autoTranslateGlobal } from './translateGlobal'

type GlobalSlug = keyof Config['globals']

type DeferredGlobalJob = {
  slug: GlobalSlug
  registry: DocumentFieldRegistry
  doc: Record<string, unknown>
  previousDoc: Record<string, unknown> | null
  sourceLocale: string
}

export function isAutosaveRequest(
  req: Pick<PayloadRequest, 'query'> | { query?: { autosave?: unknown } },
): boolean {
  const value = req.query?.autosave
  return value === true || value === 'true'
}

/** Footer/Pages pattern: never await DeepL inside the admin save. */
export function scheduleAutoTranslate(
  task: () => Promise<unknown>,
  onError: (error: unknown) => void,
): void {
  queueMicrotask(() => {
    void enqueueAutoTranslate(task).catch(onError)
  })
}

export async function runDeferredGlobalAutoTranslate(
  job: DeferredGlobalJob,
  payloadInstance?: Payload,
): Promise<void> {
  const payload = payloadInstance ?? (await getPayload({ config: configPromise }))

  const { updatedLocales } = await autoTranslateGlobal({
    payload,
    slug: job.slug,
    registry: job.registry,
    sourceDoc: job.doc,
    previousDoc: job.previousDoc,
    skipChangeCheck: true,
    sourceLocale: job.sourceLocale,
  })

  if (updatedLocales.length === 0) return

  try {
    await revalidateCacheTag(`global_${job.slug}`)
    for (const locale of localeCodes) {
      await revalidateCacheTag(`global_${job.slug}_${locale}`)
    }
  } catch (error) {
    payload.logger.warn({
      err: error,
      msg: `[autoTranslate] ${job.slug} revalidation failed after translation`,
    })
  }
}

function shouldSkipGlobalAutoTranslate(
  context: Record<string, unknown> | undefined,
  doc: Record<string, unknown>,
): boolean {
  if (isAutoTranslating(context)) return true
  if (
    context?.globalTrashAction ||
    context?.restoreNavItem ||
    context?.skipAutoTranslate ||
    context?.disableRevalidate
  ) {
    return true
  }
  return Boolean(doc[GLOBAL_DELETED_AT_FIELD])
}

/**
 * Shared Header/Footer auto-translate hook: empty-only DeepL on source save,
 * Force Translate for overwrite, deferred so the admin save is not blocked.
 */
export function createGlobalAutoTranslateHook(args: {
  slug: GlobalSlug
  registry: DocumentFieldRegistry
}): GlobalAfterChangeHook {
  const { slug, registry } = args

  return async ({ doc, previousDoc, req, context }) => {
    const record = doc as unknown as Record<string, unknown>
    if (shouldSkipGlobalAutoTranslate(context, record)) return doc

    const { sourceLocale, shouldTranslate } = await resolveAutoTranslateSourceLocale(
      req.payload,
      req.locale,
    )
    if (!shouldTranslate) return doc

    const previousRecord = previousDoc
      ? (previousDoc as unknown as Record<string, unknown>)
      : null

    if (!documentHasSourceTranslatableContent(record, registry)) return doc
    if (!documentLocalizedFieldsChanged(record, previousRecord, registry)) return doc

    const job: DeferredGlobalJob = {
      slug,
      registry,
      doc: structuredClone(record),
      previousDoc: previousRecord ? structuredClone(previousRecord) : null,
      sourceLocale,
    }

    scheduleAutoTranslate(
      () => runDeferredGlobalAutoTranslate(job, req.payload),
      (error) => {
        req.payload.logger.error({
          err: error,
          msg: `[autoTranslate] ${slug} translation failed`,
        })
      },
    )

    return doc
  }
}
