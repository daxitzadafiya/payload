import { fetchCRMProperties, unwrapCRMPropertyRecord } from '@/utilities/crmProperties'
import { getSimilarCommercialsQuery } from '@/settings/optimaCrm/client'

export type CRMPropertyDetailRecord = Record<string, unknown>

/** Same-origin proxy → NestJS (MODE) `properties/view-by-ref` (avoids browser CORS). */
const PROPERTY_DETAIL_PROXY = '/api/crm/properties/view-by-ref'

/** GET /properties/view-by-ref?user={userKey}&ref={reference}&status[]=Sold */
export async function fetchCRMPropertyDetail(
  reference: string,
  options?: {
    statuses?: string[]
    init?: Omit<RequestInit, 'method' | 'body'>
  },
): Promise<CRMPropertyDetailRecord | null> {
  const trimmedReference = reference.trim()
  if (!trimmedReference) return null

  const params = new URLSearchParams({
    ref: trimmedReference,
  })

  for (const status of options?.statuses ?? []) {
    const trimmedStatus = status.trim()
    if (trimmedStatus) params.append('status[]', trimmedStatus)
  }

  const endpoint = `${PROPERTY_DETAIL_PROXY}?${params.toString()}`
  const { headers, ...restInit } = options?.init ?? {}

  console.log('-----[GET CRM PROPERTY DETAIL - URL]------', endpoint)
  const response = await fetch(endpoint, {
    ...restInit,
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  if (!response.ok) {
    console.error(
      `CRM property detail failed (${response.status}) for reference ${trimmedReference}`,
    )
    return null
  }

  const data = (await response.json()) as unknown
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const record = unwrapCRMPropertyRecord(data as CRMPropertyDetailRecord)
  if (record.reference == null && !record._id) return null

  const topLevelBookings = (data as Record<string, unknown>).bookings
  if (Array.isArray(topLevelBookings) && !Array.isArray(record.bookings)) {
    record.bookings = topLevelBookings
  }

  return record
}

export async function fetchCRMRelatedProperties(
  references: Array<string | number>,
  limit = 3,
): Promise<CRMPropertyDetailRecord[]> {
  const numericRefs = references
    .map((ref) => (typeof ref === 'number' ? ref : Number(String(ref).trim())))
    .filter((ref) => Number.isFinite(ref))

  if (numericRefs.length === 0) return []

  const { properties } = await fetchCRMProperties({
    body: {
      options: { limit, skip: 0 },
      query: {
        reference: { $in: numericRefs },
        ...getSimilarCommercialsQuery(),
      },
    },
  })

  return properties.slice(0, limit)
}
