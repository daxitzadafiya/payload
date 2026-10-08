import { createClient } from '@libsql/client'
import path from 'path'

import type { Logo } from '@/payload-types'

export const DEFAULT_APP_NAME = 'Zariko'

export function getAppName(logo?: Pick<Logo, 'appName'> | null): string {
  const name = logo?.appName?.trim()
  return name || DEFAULT_APP_NAME
}

export function formatPageTitle(pageTitle?: string | null, appName?: string): string {
  const name = appName || DEFAULT_APP_NAME
  return pageTitle ? `${pageTitle} | ${name}` : name
}

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL || 'file:./roumpos.db'
  if (!raw.startsWith('file:')) return raw

  const filePath = raw.slice('file:'.length)
  if (path.isAbsolute(filePath)) return raw

  return `file:${path.resolve(process.cwd(), filePath)}`
}

/** Read app name from SQLite before Payload has finished booting. */
export async function getAppNameFromDatabase(): Promise<string> {
  try {
    const client = createClient({ url: resolveDatabaseUrl() })
    const { rows } = await client.execute('SELECT app_name FROM logo LIMIT 1')
    const row = rows[0] as Record<string, unknown> | undefined
    const appName = typeof row?.app_name === 'string' ? row.app_name.trim() : ''
    await client.close()
    return appName || DEFAULT_APP_NAME
  } catch {
    return DEFAULT_APP_NAME
  }
}
