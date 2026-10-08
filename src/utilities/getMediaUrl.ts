const LOCAL_MEDIA_PATH_PREFIXES = ['/api/media/', '/media/']

/**
 * Payload may persist absolute media URLs (e.g. from dev/staging). Strip the origin
 * for local media paths so production serves files from the current host.
 */
export function toRelativeMediaPath(url: string): string {
  if (!url || url.startsWith('/')) return url

  try {
    const parsed = new URL(url)
    const path = `${parsed.pathname}${parsed.search}`

    if (LOCAL_MEDIA_PATH_PREFIXES.some((prefix) => parsed.pathname.startsWith(prefix))) {
      return path
    }

    return url
  } catch {
    return url
  }
}

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 *
 * Local paths (e.g. `/api/media/file/image.webp`) are kept relative so
 * Next.js image optimization treats them as local rather than fetching
 * through `remotePatterns`, which blocks private IPs since Next.js 16.
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  const relativePath = toRelativeMediaPath(url)

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  return cacheTag ? `${relativePath}?${cacheTag}` : relativePath
}
