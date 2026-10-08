'use client'

import React from 'react'
import { SaveButton, useDocumentInfo } from '@payloadcms/ui'

import { GLOBAL_DELETED_AT_FIELD } from '@/plugins/trashAndVersions/constants'

/** Hide Save while soft-trashed; Restore is provided by GlobalTrashControls. */
export function GlobalTrashAwareSaveButton() {
  const { data } = useDocumentInfo()
  if (data?.[GLOBAL_DELETED_AT_FIELD]) return null
  return <SaveButton />
}
