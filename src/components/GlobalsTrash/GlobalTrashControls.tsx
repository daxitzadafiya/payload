'use client'

import React, { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  ConfirmationModal,
  toast,
  useAuth,
  useConfig,
  useDocumentInfo,
  useModal,
} from '@payloadcms/ui'

import { GLOBAL_DELETED_AT_FIELD } from '@/plugins/trashAndVersions/constants'

export function GlobalTrashControls() {
  const { globalSlug, data, setData, hasSavePermission } = useDocumentInfo()
  const { config } = useConfig()
  const { user } = useAuth()
  const router = useRouter()
  const { openModal } = useModal()
  const [busy, setBusy] = useState(false)

  const trashModalSlug = `global-trash-${globalSlug || 'unknown'}`
  const deletedAt = data?.[GLOBAL_DELETED_AT_FIELD]
  const isTrashed = Boolean(deletedAt)

  // Prefer relative API paths so admin works regardless of serverURL / port.
  const apiBase = config.routes.api || '/api'

  const runAction = useCallback(
    async (action: 'trash' | 'restore') => {
      if (!globalSlug || !user) return

      setBusy(true)
      try {
        const res = await fetch(`${apiBase}/trash/globals`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: globalSlug, action }),
        })

        const json = (await res.json().catch(() => ({}))) as {
          doc?: Record<string, unknown>
          errors?: { message?: string }[]
          message?: string
        }

        if (!res.ok) {
          throw new Error(json.errors?.[0]?.message || json.message || 'Request failed')
        }

        if (json.doc) {
          setData(json.doc)
        }

        toast.success(action === 'trash' ? 'Moved to trash' : 'Restored from trash')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Request failed')
      } finally {
        setBusy(false)
      }
    },
    [apiBase, globalSlug, router, setData, user],
  )

  if (!globalSlug || !hasSavePermission) return null

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {isTrashed ? (
        <Button
          buttonStyle="primary"
          disabled={busy}
          onClick={() => {
            void runAction('restore')
          }}
          size="medium"
        >
          Restore
        </Button>
      ) : (
        <>
          <Button
            buttonStyle="secondary"
            disabled={busy}
            onClick={() => openModal(trashModalSlug)}
            size="medium"
          >
            Trash
          </Button>
          <ConfirmationModal
            body="This global will be soft-deleted. All locales stay in the database and you can restore it from Globals Trash."
            confirmingLabel="Moving…"
            confirmLabel="Trash"
            heading="Trash"
            modalSlug={trashModalSlug}
            onConfirm={() => runAction('trash')}
          />
        </>
      )}
    </div>
  )
}
