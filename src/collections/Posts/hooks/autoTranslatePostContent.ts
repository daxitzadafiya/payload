import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '@/payload-types'
import { isAutoTranslating } from '@/utilities/autoTranslate/context'
import { documentHasSourceTranslatableContent } from '@/utilities/autoTranslate/documentTranslate'
import { POST_FIELD_REGISTRY } from '@/utilities/autoTranslate/postFieldRegistry'
import { resolveAutoTranslateSourceLocale } from '@/utilities/autoTranslate/resolveSourceLocale'
import { runDeferredPostAutoTranslate } from '@/utilities/autoTranslate/runDeferredPostAutoTranslate'
import {
  isAutosaveRequest,
  scheduleAutoTranslate,
} from '@/utilities/autoTranslate/scheduleAutoTranslate'

export const autoTranslatePostContent: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (isAutoTranslating(context)) return doc
  if (isAutosaveRequest(req)) return doc

  const { sourceLocale, shouldTranslate } = await resolveAutoTranslateSourceLocale(
    req.payload,
    req.locale,
  )
  if (!shouldTranslate) return doc

  const sourceRecord = doc as unknown as Record<string, unknown>

  if (!documentHasSourceTranslatableContent(sourceRecord, POST_FIELD_REGISTRY)) return doc

  // Do not gate on previousDoc field equality. Draft autosave is skipped above, so
  // Publish often lands with identical previous/current content — empty target
  // locales must still be filled. buildDocumentPatches already no-ops when every
  // target field is already a unique translation.
  const job = {
    postId: doc.id,
    slug: doc.slug,
    doc: structuredClone(doc),
    previousDoc: previousDoc ? structuredClone(previousDoc) : null,
    isDraft: doc._status !== 'published',
    sourceLocale,
  }

  scheduleAutoTranslate(
    () => runDeferredPostAutoTranslate(job),
    (error) => {
      req.payload.logger.error({
        err: error,
        msg: '[autoTranslate] post translation failed',
      })
    },
  )

  return doc
}
