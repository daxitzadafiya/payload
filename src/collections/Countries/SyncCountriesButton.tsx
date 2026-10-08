'use client'

import React, { useCallback, useState } from 'react'
import { Button, toast } from '@payloadcms/ui'

type SyncResult = {
  total: number
  added: number
  updated: number
}

export function SyncCountriesButton() {
  const [loading, setLoading] = useState(false)

  const handleSync = useCallback(async () => {
    if (loading) return
    setLoading(true)

    try {
      await toast.promise(
        (async () => {
          const response = await fetch('/api/settings/countries/sync', {
            method: 'POST',
            credentials: 'include',
          })

          const data = (await response.json().catch(() => ({}))) as SyncResult & {
            error?: string
          }

          if (!response.ok) {
            throw new Error(data.error || 'Sync failed')
          }

          window.setTimeout(() => {
            window.location.reload()
          }, 600)

          return data
        })(),
        {
          loading: 'Syncing countries from CRM…',
          success: (data) =>
            `Synced ${data.total} countries (${data.added} new, ${data.updated} updated)`,
          error: (err) => (err instanceof Error ? err.message : 'Sync failed'),
        },
      )
    } finally {
      setLoading(false)
    }
  }, [loading])

  return (
    <Button buttonStyle="secondary" size="small" onClick={handleSync} disabled={loading}>
      Sync from CRM
    </Button>
  )
}
