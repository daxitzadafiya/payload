const STORAGE_KEY = 'app:property-detail-fetch-status'

type StashedDetailFetchStatus = {
  reference: string
  statuses: string[]
}

/** CRM status values for view-by-ref when the default Available/Under Offer filter is not enough. */
export function resolvePropertyDetailFetchStatuses(input: {
  crmStatus?: string
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
  forceSold?: boolean
}): string[] | undefined {
  const normalizedStatus = input.crmStatus?.trim().toLowerCase()
  if (normalizedStatus === 'sold' || input.statusBadgeLabel === 'SOLD' || input.forceSold) {
    return ['Sold']
  }
  return undefined
}

/** Remember listing status for the next property detail fetch (not shown in the URL). */
export function stashPropertyDetailFetchStatus(reference: string, statuses: string[]): void {
  if (typeof window === 'undefined') return

  const trimmedReference = reference.trim()
  const trimmedStatuses = statuses.map((status) => status.trim()).filter(Boolean)
  if (!trimmedReference || trimmedStatuses.length === 0) return

  try {
    const payload: StashedDetailFetchStatus = {
      reference: trimmedReference,
      statuses: trimmedStatuses,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

/** Read and clear stashed status when it matches the opened property reference. */
export function takePropertyDetailFetchStatus(reference: string): string[] | undefined {
  if (typeof window === 'undefined') return undefined

  const trimmedReference = reference.trim()
  if (!trimmedReference) return undefined

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined

    sessionStorage.removeItem(STORAGE_KEY)

    const parsed = JSON.parse(raw) as StashedDetailFetchStatus
    if (parsed.reference !== trimmedReference) return undefined

    const statuses = parsed.statuses?.map((status) => status.trim()).filter(Boolean)
    return statuses?.length ? statuses : undefined
  } catch {
    return undefined
  }
}
