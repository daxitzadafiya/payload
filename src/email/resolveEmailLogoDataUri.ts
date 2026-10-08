import fs from 'fs/promises'
import path from 'path'

import { getLogoSources } from '@/components/Logo/getLogoSources'
import type { Logo, Media } from '@/payload-types'
import { toRelativeMediaPath } from '@/utilities/getMediaUrl'
import { getServerSideURL } from '@/utilities/getURL'

/** Content-ID used for the inline logo attachment in transactional emails. */
export const EMAIL_LOGO_CID = 'email-logo'

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
}

const RASTER_MIME = new Set(Object.values(MIME_BY_EXT))

export type EmailLogoAttachment = {
  filename: string
  content: Buffer
  cid: string
  contentType: string
  contentDisposition: 'inline'
}

export type ResolvedEmailLogo = {
  /** img src: cid:… when an attachment is available, otherwise a public absolute URL. */
  src: string
  /** Always a public absolute URL — use when the mailer cannot attach files (e.g. auth emails). */
  absoluteSrc: string
  attachment?: EmailLogoAttachment
}

function guessMimeType(filename: string, fallback?: string | null): string {
  if (fallback) return fallback
  const ext = path.extname(filename).slice(1).toLowerCase()
  return MIME_BY_EXT[ext] ?? 'image/png'
}

function isRasterMime(mimeType: string): boolean {
  return RASTER_MIME.has(mimeType.split(';')[0]?.trim().toLowerCase())
}

function toAbsoluteUrl(relativePath: string, serverURL: string): string {
  if (!relativePath) return serverURL
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath
  const base = serverURL.replace(/\/$/, '')
  return `${base}${relativePath.startsWith('/') ? relativePath : `/${relativePath}`}`
}

function getLightLogoMedia(logo?: Logo | null): Media | null {
  const lightLogo = logo?.lightLogo
  if (lightLogo && typeof lightLogo === 'object') return lightLogo

  const darkLogo = logo?.darkLogo
  if (darkLogo && typeof darkLogo === 'object') return darkLogo

  return null
}

function resolveLocalFilePath(src: string): string | null {
  const relativePath = toRelativeMediaPath(src).split('?')[0]

  if (relativePath.startsWith('/api/media/file/')) {
    const filename = decodeURIComponent(relativePath.slice('/api/media/file/'.length))
    return path.join(process.cwd(), 'public/media', filename)
  }

  if (relativePath.startsWith('/media/')) {
    const filename = decodeURIComponent(relativePath.slice('/media/'.length))
    return path.join(process.cwd(), 'public/media', filename)
  }

  if (relativePath.startsWith('/') && !relativePath.startsWith('//')) {
    return path.join(process.cwd(), 'public', relativePath.slice(1))
  }

  return null
}

async function readLocalFile(filePath: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(filePath)
  } catch {
    return null
  }
}

async function fetchRemoteFile(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType =
      response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/png'

    return { buffer, contentType }
  } catch {
    return null
  }
}

function buildAttachment(
  filename: string,
  content: Buffer,
  contentType: string,
): EmailLogoAttachment {
  return {
    filename,
    content,
    cid: EMAIL_LOGO_CID,
    contentType,
    contentDisposition: 'inline',
  }
}

/**
 * Resolves the site logo for HTML emails.
 *
 * Gmail (and several other clients) block `data:` URI images, so we prefer an
 * inline CID attachment. Falls back to a publicly reachable absolute URL when
 * the logo file cannot be read on the server.
 */
export async function resolveEmailLogo(logo?: Logo | null): Promise<ResolvedEmailLogo> {
  const logoSources = getLogoSources(logo)
  const serverURL = getServerSideURL()
  const media = getLightLogoMedia(logo)
  const src = logoSources.lightSrc
  const mimeType = guessMimeType(media?.filename ?? src, media?.mimeType)
  const absoluteUrl = toAbsoluteUrl(src, serverURL)
  const filename = media?.filename || path.basename(src.split('?')[0]) || 'logo.png'

  // SVG is not supported by Gmail — only use absolute URL as a last resort.
  if (!isRasterMime(mimeType)) {
    return { src: absoluteUrl, absoluteSrc: absoluteUrl }
  }

  if (media?.filename) {
    const mediaPath = path.join(process.cwd(), 'public/media', media.filename)
    const buffer = await readLocalFile(mediaPath)
    if (buffer) {
      return {
        src: `cid:${EMAIL_LOGO_CID}`,
        absoluteSrc: absoluteUrl,
        attachment: buildAttachment(filename, buffer, mimeType),
      }
    }
  }

  const localPath = resolveLocalFilePath(src)
  if (localPath) {
    const buffer = await readLocalFile(localPath)
    if (buffer) {
      return {
        src: `cid:${EMAIL_LOGO_CID}`,
        absoluteSrc: absoluteUrl,
        attachment: buildAttachment(filename, buffer, mimeType),
      }
    }
  }

  const fetched = await fetchRemoteFile(absoluteUrl)
  if (fetched && isRasterMime(fetched.contentType)) {
    return {
      src: `cid:${EMAIL_LOGO_CID}`,
      absoluteSrc: absoluteUrl,
      attachment: buildAttachment(filename, fetched.buffer, fetched.contentType),
    }
  }

  return { src: absoluteUrl, absoluteSrc: absoluteUrl }
}

/**
 * @deprecated Use {@link resolveEmailLogo}. Data URIs are blocked by Gmail.
 */
export async function resolveEmailLogoDataUri(logo?: Logo | null): Promise<string> {
  const resolved = await resolveEmailLogo(logo)
  return resolved.src
}
