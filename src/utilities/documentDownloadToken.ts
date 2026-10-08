import { createClient, type Client } from '@libsql/client'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

import type { ResolvedOptimaCrmSettings } from '@/settings/optimaCrm/shared'

/** Download links in the visitor email stop working after this window. */
export const DOCUMENT_DOWNLOAD_LINK_TTL_MS = 30 * 60 * 1000

type DownloadGrant = {
  url: string
  exp: number
  pageUrl?: string
  filename?: string
}

export type DocumentDownloadTokenResult =
  | { status: 'valid'; url: string; pageUrl?: string; filename?: string; exp: number }
  | { status: 'expired'; pageUrl?: string }
  | { status: 'invalid' }

function signingKey(): Buffer {
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret) throw new Error('PAYLOAD_SECRET is not configured')
  return createHash('sha256').update(`document-download:${secret}`).digest()
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function createDocumentDownloadToken(input: {
  url: string
  pageUrl?: string
  filename?: string
  now?: number
}): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', signingKey(), iv)
  const payload: DownloadGrant = {
    url: input.url,
    exp: (input.now ?? Date.now()) + DOCUMENT_DOWNLOAD_LINK_TTL_MS,
  }

  if (input.pageUrl && isHttpUrl(input.pageUrl)) payload.pageUrl = input.pageUrl
  if (input.filename?.trim()) payload.filename = input.filename.trim()

  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64url')
}

export function readDocumentDownloadToken(
  token: string,
  now = Date.now(),
): DocumentDownloadTokenResult {
  try {
    const raw = Buffer.from(token, 'base64url')
    if (raw.length < 12 + 16 + 1) return { status: 'invalid' }

    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const encrypted = raw.subarray(28)
    const decipher = createDecipheriv('aes-256-gcm', signingKey(), iv)
    decipher.setAuthTag(tag)
    const json = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
    const parsed = JSON.parse(json) as Partial<DownloadGrant>

    if (typeof parsed.url !== 'string' || !isHttpUrl(parsed.url)) return { status: 'invalid' }
    if (typeof parsed.exp !== 'number' || !Number.isFinite(parsed.exp)) return { status: 'invalid' }

    const pageUrl = typeof parsed.pageUrl === 'string' && isHttpUrl(parsed.pageUrl) ? parsed.pageUrl : undefined
    if (parsed.exp <= now) return { status: 'expired', pageUrl }

    return {
      status: 'valid',
      url: parsed.url,
      pageUrl,
      filename: typeof parsed.filename === 'string' ? parsed.filename : undefined,
      exp: parsed.exp,
    }
  } catch {
    return { status: 'invalid' }
  }
}

const SHORT_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const SHORT_CODE_LENGTH = 8

let downloadLinkClient: Client | undefined
let downloadLinkTableReady: Promise<void> | undefined

function downloadLinkDb(): Client {
  if (!downloadLinkClient) {
    downloadLinkClient = createClient({
      url: process.env.DATABASE_URL || 'file:./roumpos.db',
    })
  }
  return downloadLinkClient
}

function ensureDownloadLinkTable(): Promise<void> {
  downloadLinkTableReady ??= downloadLinkDb()
    .execute(`
      CREATE TABLE IF NOT EXISTS document_download_links (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        page_url TEXT,
        filename TEXT,
        expires_at INTEGER NOT NULL
      )
    `)
    .then(() => undefined)
  return downloadLinkTableReady
}

function createShortCode(): string {
  const bytes = randomBytes(SHORT_CODE_LENGTH)
  let code = ''
  for (let index = 0; index < SHORT_CODE_LENGTH; index += 1) {
    code += SHORT_CODE_ALPHABET[bytes[index]! % SHORT_CODE_ALPHABET.length]
  }
  return code
}

/** Stores the file address server-side so the email link stays short. */
export async function createDocumentDownloadLink(input: {
  url: string
  pageUrl?: string
  filename?: string
  now?: number
}): Promise<string> {
  await ensureDownloadLinkTable()
  const expiresAt = (input.now ?? Date.now()) + DOCUMENT_DOWNLOAD_LINK_TTL_MS
  const pageUrl = input.pageUrl && isHttpUrl(input.pageUrl) ? input.pageUrl : null
  const filename = input.filename?.trim() || null

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = createShortCode()
    try {
      await downloadLinkDb().execute({
        sql: `INSERT INTO document_download_links (id, url, page_url, filename, expires_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [id, input.url, pageUrl, filename, expiresAt],
      })
      return id
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (!message.toLowerCase().includes('unique')) throw error
    }
  }

  throw new Error('Could not create a download link')
}

function isShortCode(token: string): boolean {
  return new RegExp(`^[${SHORT_CODE_ALPHABET}]{${SHORT_CODE_LENGTH}}$`).test(token)
}

/** Resolves a short email code, and still accepts older encrypted links. */
export async function resolveDocumentDownloadLink(
  token: string,
  now = Date.now(),
): Promise<DocumentDownloadTokenResult> {
  if (!isShortCode(token)) return readDocumentDownloadToken(token, now)

  await ensureDownloadLinkTable()
  const result = await downloadLinkDb().execute({
    sql: `SELECT url, page_url, filename, expires_at
          FROM document_download_links
          WHERE id = ?`,
    args: [token],
  })
  const row = result.rows[0]
  if (!row) return { status: 'invalid' }

  const url = typeof row.url === 'string' ? row.url : ''
  const pageUrl = typeof row.page_url === 'string' && isHttpUrl(row.page_url) ? row.page_url : undefined
  const filename = typeof row.filename === 'string' ? row.filename : undefined
  const expiresAt = Number(row.expires_at)

  if (!isHttpUrl(url) || !Number.isFinite(expiresAt)) return { status: 'invalid' }
  if (expiresAt <= now) return { status: 'expired', pageUrl }

  return { status: 'valid', url, pageUrl, filename, exp: expiresAt }
}

function hostnameOf(value: string): string | undefined {
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return undefined
  }
}

/** Only proxy files that belong to the configured Optima CRM hosts. */
export function isAllowedDocumentDownloadUrl(
  target: string,
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
): boolean {
  const host = hostnameOf(target)
  if (!host) return false
  if (host === 'optima-crm.com' || host.endsWith('.optima-crm.com')) return true

  const configured = [
    settings.apiUrl,
    settings.contactUrl,
    settings.imageUrl,
    settings.imageUrlWithoutResize,
    settings.commercialImageBase,
    settings.constructionsImageBase,
    settings.propertyResizeBase,
  ]

  return configured.some((value) => hostnameOf(value) === host)
}
