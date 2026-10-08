/**
 * Optima CRM API helpers (server-only).
 */
import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { resolveCrmApiBaseUrl } from '@/settings/optimaCrm/shared'
import { crmServerFetch } from '@/utilities/crmServerFetch'

export type CRMConfig = {
  apiUrl: string
  apiKey: string
}

export async function getCRMConfig(): Promise<CRMConfig | null> {
  const settings = await getOptimaCrmSettings()
  const apiUrl = settings.apiUrl.trim()
  const apiKey = settings.apiKey.trim()

  if (!apiUrl || !apiKey) return null

  return { apiUrl, apiKey }
}

/**
 * `properties/*` and `commercial_properties/*` → NestJS base (MODE).
 * Other paths (incl. constructions / Yii) → legacy NEXT_NODE_URL / contact URL.
 */
export function buildCRMEndpoint(path: string, config: CRMConfig): string {
  const resource = path.replace(/^\//, '')
  const baseUrl = resolveCrmApiBaseUrl(resource, config.apiUrl)
  return `${baseUrl}/${resource}?user_apikey=${encodeURIComponent(config.apiKey)}`
}

/** Yii `r` routes use slashes — must not encode `/` as `%2F`. */
export function buildCRMContactEndpoint(contactUrl: string, route: string, apiKey: string): string {
  const normalizedRoute = route.replace(/^\//, '')
  if (!/^[a-zA-Z0-9/_-]+$/.test(normalizedRoute)) {
    throw new Error(`Invalid CRM contact route: ${route}`)
  }

  const separator = contactUrl.includes('?') ? '&' : '?'
  return `${contactUrl}${separator}r=${normalizedRoute}&user_apikey=${encodeURIComponent(apiKey)}`
}

/** Yii `r` routes use slashes — must not encode `/` as `%2F`. */
export function buildCRMContactEndpointWithUserKey(
  contactUrl: string,
  route: string,
  userKey: string,
): string {
  const normalizedRoute = route.replace(/^\//, '')
  if (!/^[a-zA-Z0-9/_-]+$/.test(normalizedRoute)) {
    throw new Error(`Invalid CRM contact route: ${route}`)
  }

  const separator = contactUrl.includes('?') ? '&' : '?'
  return `${contactUrl}${separator}r=${normalizedRoute}&user=${encodeURIComponent(userKey)}`
}

export async function getFromCRMContact(
  route: string,
  init?: Omit<RequestInit, 'method'>,
): Promise<Response> {
  const settings = await getOptimaCrmSettings()
  const contactUrl = settings.contactUrl.trim()
  const apiKey = settings.apiKey.trim()

  if (!contactUrl || !apiKey) {
    throw new Error(
      'CRM contact URL is not configured. Set credentials under Globals → Optima CRM in the admin panel.',
    )
  }

  const endpoint = buildCRMContactEndpoint(contactUrl, route, apiKey)

  return crmServerFetch(endpoint, {
    ...init,
    method: 'GET',
    cache: 'no-store',
  })
}

/** GET on Yii contact URL with extra query params (e.g. bookings/create-booking). */
export async function getFromCRMContactWithQuery(
  route: string,
  searchParams: URLSearchParams,
  init?: Omit<RequestInit, 'method'>,
): Promise<Response> {
  const settings = await getOptimaCrmSettings()
  const contactUrl = settings.contactUrl.trim()
  const apiKey = settings.apiKey.trim()

  if (!contactUrl || !apiKey) {
    throw new Error(
      'CRM contact URL is not configured. Set credentials under Globals → Optima CRM in the admin panel.',
    )
  }

  const endpoint = buildCRMContactEndpoint(contactUrl, route, apiKey)
  const queryString = searchParams.toString()
  const url = queryString ? `${endpoint}&${queryString}` : endpoint

  return crmServerFetch(url, {
    ...init,
    method: 'GET',
    cache: 'no-store',
  })
}

/** GET on Yii contact URL using `user` query param (instead of `user_apikey`). */
export async function getFromCRMContactWithQueryUsingUserKey(
  route: string,
  searchParams: URLSearchParams,
  init?: Omit<RequestInit, 'method'>,
): Promise<Response> {
  const settings = await getOptimaCrmSettings()
  const contactUrl = settings.contactUrl.trim()
  const userKey = settings.userKey.trim()

  if (!contactUrl || !userKey) {
    throw new Error(
      'CRM contact URL / user key is not configured. Set credentials under Globals → Optima CRM in the admin panel.',
    )
  }

  const endpoint = buildCRMContactEndpointWithUserKey(contactUrl, route, userKey)
  const queryString = searchParams.toString()
  const url = queryString ? `${endpoint}&${queryString}` : endpoint

  console.log('------[GET FROM CRM WITH QUERY USING USER KEY - URL]------', url)
  // params 
  console.log('------[GET FROM CRM WITH QUERY USING USER KEY - PARAMS]------', searchParams)
  // When `init.body` is set (e.g. constructions `{ project_ids }`), crmServerFetch
  // uses Node http so GET+body works like PHP curl in gestali/pedro.
  return crmServerFetch(url, {
    ...init,
    method: 'GET',
    cache: 'no-store',
  })
}

export async function getFromCRM(
  path: string,
  searchParams: URLSearchParams,
  init?: Omit<RequestInit, 'method'>,
): Promise<Response> {
  const config = await getCRMConfig()
  if (!config) {
    throw new Error(
      'CRM API is not configured. Set credentials under Globals → Optima CRM in the admin panel.',
    )
  }

  const endpoint = buildCRMEndpoint(path, config)
  const queryString = searchParams.toString()
  const url = queryString ? `${endpoint}&${queryString}` : endpoint

  console.log('------[GET FROM CRM - URL]------', url)
  return crmServerFetch(url, {
    ...init,
    method: 'GET',
    cache: 'no-store',
  })
}

export async function postToCRMWithUserKey(
  path: string,
  body: Record<string, unknown>,
  init?: Omit<RequestInit, 'method' | 'body'>,
  searchParams?: URLSearchParams,
): Promise<Response> {
  const settings = await getOptimaCrmSettings()
  const userKey = settings.userKey.trim()
  const resource = path.replace(/^\//, '')
  const baseUrl = resolveCrmApiBaseUrl(resource, settings.apiUrl.trim())

  if (!baseUrl || !userKey) {
    throw new Error(
      'CRM API URL / user key is not configured in environment variables.',
    )
  }

  const params = new URLSearchParams(searchParams)
  if (!params.has('user')) params.set('user', userKey)
  const endpoint = `${baseUrl}/${resource}?${params.toString()}`
  const { headers, ...restInit } = init ?? {}

  return crmServerFetch(endpoint, {
    ...restInit,
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

export async function postToCRM(
  path: string,
  body: Record<string, unknown>,
  init?: Omit<RequestInit, 'method' | 'body'>,
  searchParams?: URLSearchParams,
): Promise<Response> {
  const config = await getCRMConfig()
  if (!config) {
    throw new Error(
      'CRM API is not configured. Set credentials under Globals → Optima CRM in the admin panel.',
    )
  }

  const endpoint = buildCRMEndpoint(path, config)
  const queryString = searchParams?.toString()
  const url = queryString ? `${endpoint}&${queryString}` : endpoint
  const { headers, ...restInit } = init ?? {}

  console.log('------[POST TO CRM - URL]------', url)
  console.log('------[POST TO CRM - BODY]------')
  console.dir(body, { depth: null })
  console.log('------[POST TO CRM - BODY]------')
  return crmServerFetch(url, {
    ...restInit,
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}
