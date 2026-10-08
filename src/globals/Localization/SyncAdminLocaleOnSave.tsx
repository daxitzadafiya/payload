'use client'

import {
  useDocumentInfo,
  useFormFields,
  useLocale,
  useRouteTransition,
} from '@payloadcms/ui'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * After Localization is saved, switch the admin content Locale menu to match
 * Default language — same navigation pattern Payload's Localizer uses.
 *
 * Important: watch `data.updatedAt`, not `lastUpdateTime`. Payload also bumps
 * `lastUpdateTime` when document locking updates `lastEditedAt` on field edits
 * (e.g. picking Content locale), which would call router.refresh() and wipe
 * unsaved form state.
 *
 * Note: do not key off `useFormSubmitted()` — Payload sets it back to `false`
 * on a successful save.
 */
export function SyncAdminLocaleOnSave() {
  const router = useRouter()
  const pathname = usePathname()
  const { startRouteTransition } = useRouteTransition()
  const locale = useLocale()
  const { data } = useDocumentInfo()
  const savedUpdatedAt =
    typeof data?.updatedAt === 'string' ? data.updatedAt : undefined
  const defaultLocale = useFormFields(
    ([fields]) => fields.defaultLocale?.value as string | undefined,
  )
  const previousUpdatedAt = useRef<string | null>(null)

  useEffect(() => {
    if (!savedUpdatedAt) {
      return
    }

    // Skip the initial mount value — only react to saves after this component mounts.
    if (previousUpdatedAt.current === null) {
      previousUpdatedAt.current = savedUpdatedAt
      return
    }

    if (previousUpdatedAt.current === savedUpdatedAt) {
      return
    }

    previousUpdatedAt.current = savedUpdatedAt

    if (!defaultLocale || !locale?.code || locale.code === defaultLocale) {
      // Still refresh so Account → Language picks up Localization changes
      startRouteTransition(() => {
        router.refresh()
      })
      return
    }

    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    )
    params.set('locale', defaultLocale)
    const url = `${pathname}?${params.toString()}`

    startRouteTransition(() => {
      router.replace(url)
      router.refresh()
    })
  }, [
    defaultLocale,
    savedUpdatedAt,
    locale?.code,
    pathname,
    router,
    startRouteTransition,
  ])

  return null
}
