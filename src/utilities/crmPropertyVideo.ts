import { getLocalizedText, isCRMTruthy } from '@/utilities/localizedValue'

export type CRMPropertyVideoKind = 'youtube' | 'matterport' | 'iframe' | 'file'

export type CRMPropertyVideoItem = {
  embedUrl: string
  sourceUrl: string
  label: string
  kind: CRMPropertyVideoKind
}

const parseYouTubeVideoId = (url: string): string | undefined => {
  const trimmed = url.trim()
  if (!trimmed) return undefined

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]
      return id || undefined
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const queryId = parsed.searchParams.get('v')
      if (queryId) return queryId

      const pathMatch = parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)
      if (pathMatch?.[1]) return pathMatch[1]
    }
  } catch {
    const fallbackMatch = trimmed.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)
    if (fallbackMatch?.[1]) return fallbackMatch[1]
  }

  return undefined
}

const toYouTubeEmbedUrl = (videoId: string): string =>
  `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`

const isMatterportUrl = (url: string): boolean => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
    return host === 'my.matterport.com' || host.endsWith('.matterport.com')
  } catch {
    return url.includes('matterport.com')
  }
}

const toMatterportEmbedUrl = (url: string): string => {
  try {
    const parsed = new URL(url)
    if (!parsed.searchParams.has('play')) {
      parsed.searchParams.set('play', '1')
    }
    return parsed.toString()
  } catch {
    return url
  }
}

const isDirectVideoFileUrl = (url: string): boolean =>
  /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url)

const resolveEmbedFromUrl = (
  sourceUrl: string,
): { embedUrl: string; kind: CRMPropertyVideoKind } | undefined => {
  const youtubeId = parseYouTubeVideoId(sourceUrl)
  if (youtubeId) {
    return { embedUrl: toYouTubeEmbedUrl(youtubeId), kind: 'youtube' }
  }

  if (isMatterportUrl(sourceUrl)) {
    return { embedUrl: toMatterportEmbedUrl(sourceUrl), kind: 'matterport' }
  }

  if (isDirectVideoFileUrl(sourceUrl)) {
    return { embedUrl: sourceUrl, kind: 'file' }
  }

  try {
    const parsed = new URL(sourceUrl)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return { embedUrl: sourceUrl, kind: 'iframe' }
    }
  } catch {
    return undefined
  }

  return undefined
}

const defaultLabelForEntry = (
  entry: Record<string, unknown>,
  kind: CRMPropertyVideoKind,
): string => {
  const type = entry.type
  if (type === 2 || type === '2') return '360 Tour'
  if (type === 'Video' || type === 1 || type === '1') return 'Video'
  if (kind === 'matterport') return '360 Tour'
  if (kind === 'youtube') return 'Video'
  return 'Property Media'
}

const resolveVideoLabel = (
  entry: Record<string, unknown>,
  locale: string,
  kind: CRMPropertyVideoKind,
): string => {
  const description = getLocalizedText(entry.description, locale).trim()
  if (description) return description

  return defaultLabelForEntry(entry, kind)
}

const resolveVideoUrlFromEntry = (entry: unknown, locale: string): string | undefined => {
  if (!entry || typeof entry !== 'object') return undefined

  const video = entry as Record<string, unknown>
  if (!isCRMTruthy(video.status)) return undefined

  const localizedUrl = getLocalizedText(video.url, locale)
  if (localizedUrl.trim()) return localizedUrl.trim()

  if (typeof video.url === 'string' && video.url.trim()) {
    return video.url.trim()
  }

  return undefined
}

export const resolveCRMPropertyVideos = (
  property: Record<string, unknown>,
  locale: string,
): CRMPropertyVideoItem[] => {
  const candidates: unknown[] = []

  if (Array.isArray(property.videos)) candidates.push(...property.videos)

  const nested = property.property
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const nestedVideos = (nested as Record<string, unknown>).videos
    if (Array.isArray(nestedVideos)) candidates.push(...nestedVideos)
  }

  const raw = property._raw
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const rawRecord = raw as Record<string, unknown>
    if (Array.isArray(rawRecord.videos)) candidates.push(...rawRecord.videos)
    const rawProperty = rawRecord.property
    if (rawProperty && typeof rawProperty === 'object' && !Array.isArray(rawProperty)) {
      const rawVideos = (rawProperty as Record<string, unknown>).videos
      if (Array.isArray(rawVideos)) candidates.push(...rawVideos)
    }
  }

  const results: CRMPropertyVideoItem[] = []
  const seen = new Set<string>()

  for (const entry of candidates) {
    const sourceUrl = resolveVideoUrlFromEntry(entry, locale)
    if (!sourceUrl) continue

    const embed = resolveEmbedFromUrl(sourceUrl)
    if (!embed) continue

    const dedupeKey = `${embed.kind}:${embed.embedUrl}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const videoEntry = entry as Record<string, unknown>

    results.push({
      sourceUrl,
      embedUrl: embed.embedUrl,
      kind: embed.kind,
      label: resolveVideoLabel(videoEntry, locale, embed.kind),
    })
  }

  return results
}

/** @deprecated Use resolveCRMPropertyVideos — returns the first embeddable video only. */
export const resolveCRMPropertyVideoEmbed = (
  property: Record<string, unknown>,
  locale: string,
): CRMPropertyVideoItem | undefined => resolveCRMPropertyVideos(property, locale)[0]
