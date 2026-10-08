import type { ResolvedOptimaCrmSettings } from '@/settings/optimaCrm/shared'
import { crmServerFetch } from '@/utilities/crmServerFetch'
import { isAllowedDocumentDownloadUrl } from '@/utilities/documentDownloadToken'

const MAX_REDIRECTS = 5

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Fetches a CRM document for email download links.
 *
 * Only the original URL must be on an allowed CRM host. Later hops are followed
 * freely over http(s) because Optima often 302s to signed S3/CDN URLs — those
 * work in a browser but are not on the CRM allowlist.
 */
export async function fetchAllowedDocument(
  url: string,
  settings: Pick<
    ResolvedOptimaCrmSettings,
    | 'apiUrl'
    | 'contactUrl'
    | 'imageUrl'
    | 'imageUrlWithoutResize'
    | 'commercialImageBase'
    | 'constructionsImageBase'
    | 'propertyResizeBase'
  >,
): Promise<Response> {
  if (!isAllowedDocumentDownloadUrl(url, settings)) {
    throw new Error('Download URL is not allowed')
  }

  let current = url

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (hop > 0 && !isHttpUrl(current)) {
      throw new Error('Download redirect uses an unsupported protocol')
    }

    const response = await crmServerFetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        Accept: '*/*',
      },
    })

    if (response.status < 300 || response.status >= 400) return response

    const location = response.headers.get('location')
    if (!location) throw new Error('Download redirect is missing a location')
    current = new URL(location, current).toString()
  }

  throw new Error('Download redirect limit reached')
}

export function documentDownloadFilename(label: string | undefined, contentType: string): string {
  const cleaned = (label ?? '')
    .replace(/[^\w.\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const base = cleaned || 'document'
  const type = contentType.toLowerCase()
  const extension = type.includes('pdf')
    ? '.pdf'
    : type.includes('png')
      ? '.png'
      : type.includes('jpeg') || type.includes('jpg')
        ? '.jpg'
        : type.includes('webp')
          ? '.webp'
          : ''

  if (!extension || base.toLowerCase().endsWith(extension)) return base
  return `${base}${extension}`
}
