import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'

/**
 * Node's built-in fetch verifies TLS strictly. On some Windows dev machines the
 * Optima CRM certificate chain fails verification even though browser fetch works.
 * Use this helper for server-side CRM calls in development only.
 */
export function shouldAllowInsecureCrmTls(): boolean {
  return process.env.CRM_ALLOW_INSECURE_TLS === 'true' || process.env.NODE_ENV === 'development'
}

function nodeRequest(
  url: string,
  init: RequestInit,
  rejectUnauthorized: boolean,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const isHttps = parsed.protocol === 'https:'
    const transport = isHttps ? https : http
    const body =
      init.body == null
        ? undefined
        : typeof init.body === 'string'
          ? init.body
          : JSON.stringify(init.body)

    const headers = new Headers(init.headers ?? {})
    if (body != null && !headers.has('Content-Length')) {
      headers.set('Content-Length', String(Buffer.byteLength(body)))
    }

    const request = transport.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method: init.method ?? 'GET',
        headers: Object.fromEntries(headers.entries()),
        ...(isHttps ? { rejectUnauthorized } : {}),
      },
      (response) => {
        const chunks: Buffer[] = []
        response.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        response.on('end', () => {
          const responseHeaders = new Headers()
          for (const [key, value] of Object.entries(response.headers)) {
            if (value == null) continue
            if (Array.isArray(value)) {
              value.forEach((entry) => responseHeaders.append(key, entry))
            } else {
              responseHeaders.set(key, value)
            }
          }

          resolve(
            new Response(Buffer.concat(chunks), {
              status: response.statusCode ?? 500,
              statusText: response.statusMessage,
              headers: responseHeaders,
            }),
          )
        })
      },
    )

    request.on('error', reject)
    if (body != null) request.write(body)
    request.end()
  })
}

export async function crmServerFetch(url: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const hasBody = init?.body != null && init.body !== ''

  // Optima constructions map-area filter (gestali/pedro Developments::findAll) sends
  // JSON `{ project_ids }` on a GET — PHP curl allows this; undici/fetch does not.
  if (hasBody && (method === 'GET' || method === 'HEAD')) {
    console.log('crmServerFetch:::url (GET+body) >>>>', url)
    console.log('Body >>>>', init?.body)
    return nodeRequest(url, init ?? {}, !shouldAllowInsecureCrmTls())
  }

  if (!shouldAllowInsecureCrmTls()) {
    return fetch(url, init)
  }

  try {
    console.log('crmServerFetch:::url >>>>', url)
    return await fetch(url, init)
  } catch (error) {
    const causeMessage =
      error instanceof Error && error.cause instanceof Error ? error.cause.message : ''
    const message = error instanceof Error ? error.message : ''

    const isTlsError =
      message.includes('unable to verify the first certificate') ||
      causeMessage.includes('unable to verify the first certificate')

    if (!isTlsError) {
      throw error
    }

    return nodeRequest(url, init ?? {}, false)
  }
}
