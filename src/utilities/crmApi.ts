/**
 * Browser-safe Optima CRM API helpers.
 *
 * All CRM requests from browser code must use same-origin Next.js routes.
 * Credential-bearing upstream URLs are constructed only on the server.
 */

const CRM_PROXY_BY_PATH: Record<string, string> = {
  properties: '/api/crm/commercial-properties',
  commercial_properties: '/api/crm/commercial-properties',
  commercial_types: '/api/crm/commercial-types',
  'locations/geo-data-if-property-exists':
    '/api/crm/locations/geo-data-if-property-exists',
}

function resolveCRMProxy(path: string): string {
  const resource = path.replace(/^\/+|\/+$/g, '')
  const proxy = CRM_PROXY_BY_PATH[resource]

  if (!proxy) {
    throw new Error(`Browser CRM path is not proxied: ${resource}`)
  }

  return proxy
}

export async function getFromCRM(
  path: string,
  searchParams: URLSearchParams,
  init?: Omit<RequestInit, 'method'>,
): Promise<Response> {
  const proxy = resolveCRMProxy(path)
  const queryString = searchParams.toString()
  const url = queryString ? `${proxy}?${queryString}` : proxy

  return fetch(url, {
    ...init,
    method: 'GET',
    cache: 'no-store',
  })
}

export async function postToCRM(
  path: string,
  body: Record<string, unknown>,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<Response> {
  const proxy = resolveCRMProxy(path)
  const { headers, ...restInit } = init ?? {}

  return fetch(proxy, {
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
