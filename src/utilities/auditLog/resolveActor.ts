import type { PayloadRequest } from 'payload'

import { cmsLocales } from '@/i18n/locales'

export type AuditActor = {
  updatedBy?: number
  actorLabel: string
}

export function resolveUpdatedBy(req: PayloadRequest): number | undefined {
  const user = req.user
  if (!user || user.collection !== 'users') return undefined
  const id = user.id
  if (typeof id === 'number') return id
  if (typeof id === 'string' && /^\d+$/.test(id)) return Number(id)
  return undefined
}

/** Always returns a display name — never leaves Updated By empty. */
export function resolveActor(req: PayloadRequest): AuditActor {
  const user = req.user
  const updatedBy = resolveUpdatedBy(req)

  if (user && user.collection === 'users') {
    const name =
      typeof (user as { name?: unknown }).name === 'string' &&
      (user as { name: string }).name.trim()
        ? (user as { name: string }).name.trim()
        : typeof user.email === 'string' && user.email.trim()
          ? user.email.trim()
          : updatedBy !== undefined
            ? `User #${updatedBy}`
            : 'Authenticated user'

    return { updatedBy, actorLabel: name }
  }

  return { actorLabel: 'System' }
}

export function resolveLocale(req: PayloadRequest): string {
  const locale = req.locale
  if (!locale || locale === 'all') return 'all'
  return String(locale)
}

export function resolveLocaleLabel(code: string | null | undefined): string {
  if (!code || code === 'all') return 'All languages'
  const found = cmsLocales.find((l) => l.code === code)
  if (found) return `${found.label} (${found.code})`
  return code.toUpperCase()
}
