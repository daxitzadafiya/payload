import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { getNestCrmApiBaseUrl } from '@/settings/optimaCrm/shared'

import {
  mapContactToOptimaPayload,
  postOptimaCrmJson,
  submissionDataToCrmPayload,
  type OptimaSubmissionField,
} from '@/utilities/submitContactToOptimaCrm'

const OWNER_SOURCE = 'web-client'

export const OWNER_TRANSACTION_TYPES = ['sale', 'rent'] as const

export type OwnerTransactionType = (typeof OWNER_TRANSACTION_TYPES)[number]

function isOwnerTransactionType(value: string): value is OwnerTransactionType {
  return (OWNER_TRANSACTION_TYPES as readonly string[]).includes(value)
}

/** CRM comments use Sell / Rent, matching the page that opened the form. */
function ownerIntentLabel(transactionType: OwnerTransactionType): 'Sell' | 'Rent' {
  return transactionType === 'sale' ? 'Sell' : 'Rent'
}

export function appendOwnerIntentToMessage(
  message: string,
  transactionType: OwnerTransactionType,
): string {
  const label = ownerIntentLabel(transactionType)
  const base = message.trim()
  return base ? `${base} - ${label}` : label
}

export async function buildOwnersUrl(): Promise<string> {
  const settings = await getOptimaCrmSettings()
  const apiKey = settings.apiKey.trim()
  const base = getNestCrmApiBaseUrl()

  if (!apiKey) {
    throw new Error('CRM API key is not configured. Set it under Globals → Optima CRM.')
  }

  if (!base) {
    throw new Error(
      'CRM Nest API URL is not configured. Set NEXT_PUBLIC_CRM_NEST_API_URL_DEV or NEXT_PUBLIC_CRM_NEST_API_URL_PROD.',
    )
  }

  return `${base}/public/owners?user_apikey=${encodeURIComponent(apiKey)}&json=1`
}

/**
 * Forwards an owner enquiry to Optima `public/owners`.
 * Reuses the account payload and adds `transaction_types` (`sale` or `rent`).
 * Does not create an account.
 */
export async function submitOwnerToOptimaCrm(
  submissionData?: OptimaSubmissionField[] | null,
  locale?: string,
): Promise<unknown> {
  const rawPayload = submissionDataToCrmPayload(submissionData)
  const transactionRaw =
    typeof rawPayload.transaction_types === 'string' ? rawPayload.transaction_types.trim() : ''

  if (!isOwnerTransactionType(transactionRaw)) {
    throw new Error('Please choose whether you want to rent out or sell your property.')
  }

  const mapped = mapContactToOptimaPayload(rawPayload, locale)
  const messageWithIntent = appendOwnerIntentToMessage(
    typeof mapped.message === 'string' ? mapped.message : '',
    transactionRaw,
  )

  const payload: Record<string, unknown> = {
    ...mapped,
    message: messageWithIntent,
    comments: messageWithIntent,
    transaction_types: transactionRaw,
    source: OWNER_SOURCE,
  }

  const phone = typeof payload.phone === 'string' ? payload.phone.trim() : ''
  if (phone && typeof payload.mobile !== 'string') {
    payload.mobile = phone
  }

  const endpoint = await buildOwnersUrl()
  return postOptimaCrmJson(endpoint, payload)
}
