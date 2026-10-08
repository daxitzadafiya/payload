import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { getNestCrmApiBaseUrl } from '@/settings/optimaCrm/shared'
import { crmServerFetch } from '@/utilities/crmServerFetch'
import { mapLocaleToBrochurePdfLang } from '@/utilities/propertyBrochure'
import {
  COMMERCIAL_PROFILE_TYPE_ONE_FIELD,
  COMMERCIAL_PROFILE_TYPE_TWO_FIELD,
  DISPLAY_REFERENCE_FIELD,
  PROJECT_REFERENCE_FIELD,
} from '@/utilities/propertyInquiry'

export type OptimaSubmissionField = {
  field: string
  value: string | boolean
}

const CONTACT_SOURCE = 'web-client'

const FIRST_NAME_ALIASES = [
  'forename',
  'first_name',
  'first-name',
  'firstname',
  'firstName',
] as const

const FULL_NAME_ALIASES = ['full-name', 'full_name', 'fullname', 'fullName'] as const

const SURNAME_ALIASES = ['surname', 'last_name', 'last-name', 'lastname', 'lastName'] as const

const PASSTHROUGH_FIELDS = [
  'email',
  'phone',
  'subject',
  'p_type',
  'transaction_types',
  'interest',
  'other_reference',
  'cities',
  'lgroups',
  'countries',
  'budget_min',
  'budget_max',
  'min_bedrooms',
  'min_bathrooms',
  'feet_views',
  'feet_categories',
  'garden',
  'parking',
  'pool',
  'rent_from_date',
  'rent_to_date',
  'min_sleeps',
] as const

/** Fields sent to Optima as JSON booleans (not strings). */
const BOOLEAN_FIELDS = new Set(['gdpr_status'])

/** Comma-separated CRM list fields → arrays (or comma string when CRM expects implode). */
const COMMA_LIST_FIELDS = new Set([
  'cities',
  'lgroups',
  'countries',
  'feet_views',
  'feet_categories',
  'garden',
  'parking',
  'pool',
])

/** Nest `POST /public/accounts` for contact and document-download account creation. */
export async function buildAccountsIndexUrl(): Promise<string> {
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

  return `${base}/public/accounts?user_apikey=${encodeURIComponent(apiKey)}&json=1`
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return (
      normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes'
    )
  }
  return Boolean(value)
}

export function submissionDataToCrmPayload(
  submissionData?: OptimaSubmissionField[] | null,
): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {}

  for (const item of submissionData ?? []) {
    if (!item?.field) continue
    if (BOOLEAN_FIELDS.has(item.field)) {
      out[item.field] = toBoolean(item.value)
    } else {
      out[item.field] = item.value != null ? String(item.value) : ''
    }
  }

  return out
}

function pickStringField(
  payload: Record<string, string | boolean>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function splitCommaList(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function applyCommercialProfileFields(
  out: Record<string, unknown>,
  payload: Record<string, string | boolean>,
): void {
  const typeOne = payload[COMMERCIAL_PROFILE_TYPE_ONE_FIELD]
  const typeTwo = payload[COMMERCIAL_PROFILE_TYPE_TWO_FIELD]
  const profile: Record<string, string[]> = {}

  if (typeof typeOne === 'string' && typeOne.trim()) {
    profile.type_one = splitCommaList(typeOne)
  }

  if (typeof typeTwo === 'string' && typeTwo.trim()) {
    profile.type_two = splitCommaList(typeTwo)
  }

  if (Object.keys(profile).length > 0) {
    out.commercial_profile = profile
  }
}

function applyCommaListFields(
  out: Record<string, unknown>,
  payload: Record<string, string | boolean>,
): void {
  for (const key of COMMA_LIST_FIELDS) {
    const value = payload[key]
    if (typeof value !== 'string' || !value.trim()) continue
    // Optima accounts/index accepts comma-separated strings (gestali saveAccount implode).
    out[key] = value.trim()
  }
}

/**
 * Maps contact and property-inquiry submissions to the Optima CRM accounts/index shape.
 */
export function mapContactToOptimaPayload(
  payload: Record<string, string | boolean>,
  locale?: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  const forename =
    pickStringField(payload, [...FIRST_NAME_ALIASES]) ??
    (!pickStringField(payload, [...SURNAME_ALIASES])
      ? pickStringField(payload, [...FULL_NAME_ALIASES])
      : undefined)

  const surname = pickStringField(payload, [...SURNAME_ALIASES])
  const message = pickStringField(payload, ['message', 'comments'])
  const searchCriteria = pickStringField(payload, ['search_criteria'])
  const projectReference = pickStringField(payload, [PROJECT_REFERENCE_FIELD])
  const displayReference = pickStringField(payload, [DISPLAY_REFERENCE_FIELD])
  const isProject = payload.p_type === 'project'
  const property = isProject
    ? undefined
    : pickStringField(payload, ['property', 'reference', '_id'])
  const toEmail = pickStringField(payload, ['to_email', 'assigned_to'])

  if (forename) out.forename = forename
  if (surname) out.surname = surname

  for (const key of PASSTHROUGH_FIELDS) {
    if (COMMA_LIST_FIELDS.has(key)) continue
    if (isProject && key === 'transaction_types') continue
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) out[key] = value.trim()
  }

  if (payload.gdpr_status !== undefined) {
    out.gdpr_status = toBoolean(payload.gdpr_status)
  }

  // Project leads: append human-readable REF into message/comments (admin display field).
  // CRM identity keys (`property` / system `project_reference`) stay unchanged above.
  const messageReference = isProject
    ? displayReference || projectReference
    : undefined
  const referenceLine = messageReference ? `Reference: ${messageReference}` : undefined
  const combinedMessage = [message, searchCriteria, referenceLine].filter(Boolean).join('\n\n')
  if (combinedMessage) {
    out.message = combinedMessage
    out.comments = combinedMessage
  }

  if (property) out.property = property
  if (toEmail) out.to_email = toEmail

  applyCommercialProfileFields(out, payload)
  applyCommaListFields(out, payload)

  if (locale?.trim()) {
    out.language = mapLocaleToBrochurePdfLang(locale)
  }

  return out
}

function formatOptimaMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (Array.isArray(value)) {
    const parts = value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    if (parts.length) return parts.join(' ')
  }
  return null
}

function extractOptimaErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null

  const record = data as Record<string, unknown>

  if (record.success === false) {
    return (
      formatOptimaMessage(record.error) ||
      formatOptimaMessage(record.message) ||
      formatOptimaMessage(record.msg) ||
      'CRM submission was rejected. Please check your details and try again.'
    )
  }

  if (record.status === 'error' || record.status === false) {
    return (
      formatOptimaMessage(record.error) ||
      formatOptimaMessage(record.message) ||
      'CRM submission was rejected. Please check your details and try again.'
    )
  }

  const directError = formatOptimaMessage(record.error)
  if (directError) return directError

  const errors = record.errors
  if (Array.isArray(errors) && errors.length > 0) {
    return formatOptimaMessage(errors[0]) || formatOptimaMessage(errors)
  }

  return null
}

export async function parseOptimaCrmResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  let data: unknown = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      if (!response.ok) {
        throw new Error(`CRM submission failed (${response.status}). Please try again later.`)
      }
      return text
    }
  }

  const optimaError = extractOptimaErrorMessage(data)

  if (!response.ok) {
    throw new Error(
      optimaError || `CRM submission failed (${response.status}). Please try again later.`,
    )
  }

  if (optimaError) {
    throw new Error(optimaError)
  }

  return data
}

/** POSTs a JSON body to an Optima CRM endpoint and maps rejection bodies to errors. */
export async function postOptimaCrmJson(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  let response: Response

  try {
    response = await crmServerFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    const causeMessage =
      error instanceof Error && error.cause instanceof Error ? error.cause.message : ''
    const message = error instanceof Error ? error.message : 'CRM request failed'

    if (
      message.includes('unable to verify the first certificate') ||
      causeMessage.includes('unable to verify the first certificate')
    ) {
      throw new Error(
        'Could not connect to CRM due to an SSL certificate issue. For local development, restart the dev server after setting CRM_ALLOW_INSECURE_TLS=true in .env if the problem persists.',
      )
    }

    throw new Error(message)
  }

  return parseOptimaCrmResponse(response)
}

/**
 * Forwards contact and document-download submissions to Optima `public/accounts`.
 * Uses JSON so boolean fields (e.g. gdpr_status) are sent as true/false, not "true"/"false".
 */
export async function submitContactToOptimaCrm(
  submissionData?: OptimaSubmissionField[] | null,
  locale?: string,
): Promise<unknown> {
  const endpoint = await buildAccountsIndexUrl()
  const rawPayload = submissionDataToCrmPayload(submissionData)
  const payload = {
    ...mapContactToOptimaPayload(rawPayload, locale),
    source: CONTACT_SOURCE,
  }

  return postOptimaCrmJson(endpoint, payload)
}
