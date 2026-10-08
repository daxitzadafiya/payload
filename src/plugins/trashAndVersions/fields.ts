import type { Field, GlobalBeforeChangeHook, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { a } from '@/utilities/adminI18n'

import { GLOBAL_DELETED_AT_FIELD } from './constants'

export const trashedAtField: Field = {
  name: GLOBAL_DELETED_AT_FIELD,
  type: 'date',
  admin: {
    disableBulkEdit: true,
    disableListColumn: true,
    disableListFilter: true,
    hidden: true,
    readOnly: true,
  },
  index: true,
  label: a('admin.globalsTrash.fields.trashedAt', 'Trashed At'),
}

/** @deprecated use trashedAtField */
export const deletedAtField = trashedAtField

type GlobalTrashContext = {
  globalTrashAction?: 'trash' | 'restore'
}

/** Block content edits while soft-trashed; trash/restore goes through the dedicated endpoint. */
export const blockEditsWhileGlobalTrashed: GlobalBeforeChangeHook = ({
  data,
  originalDoc,
  context,
}) => {
  if (!data) return data

  const trashContext = context as GlobalTrashContext
  if (trashContext?.globalTrashAction === 'trash' || trashContext?.globalTrashAction === 'restore') {
    return data
  }

  if (originalDoc?.[GLOBAL_DELETED_AT_FIELD]) {
    throw new APIError('This global is in trash. Restore it before editing.', 403)
  }

  return data
}

export async function setGlobalTrashState({
  req,
  slug,
  trash,
}: {
  req: PayloadRequest
  slug: string
  trash: boolean
}): Promise<unknown> {
  return req.payload.updateGlobal({
    slug: slug as never,
    data: {
      [GLOBAL_DELETED_AT_FIELD]: trash ? new Date().toISOString() : null,
    } as never,
    req,
    depth: 0,
    overrideAccess: false,
    context: {
      globalTrashAction: trash ? 'trash' : 'restore',
      disableRevalidate: true,
      skipAutoTranslate: true,
    },
  })
}
