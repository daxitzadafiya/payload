import { createClient } from '@libsql/client'
import path from 'path'

import type { ResolvedEmailSettings } from '@/settings/email/shared'

export type EmailSenderDefaults = {
  defaultFromAddress: string
  defaultFromName: string
}

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL || 'file:./roumpos.db'
  if (!raw.startsWith('file:')) return raw

  const filePath = raw.slice('file:'.length)
  if (path.isAbsolute(filePath)) return raw

  return `file:${path.resolve(process.cwd(), filePath)}`
}

function toSenderDefaults(settings: ResolvedEmailSettings | null | undefined): EmailSenderDefaults | null {
  const fromAddress = settings?.sender?.fromAddress?.trim()
  const fromName = settings?.sender?.fromName?.trim()

  if (!fromAddress || !fromName) return null

  return {
    defaultFromAddress: fromAddress,
    defaultFromName: fromName,
  }
}

/** Read sender defaults from SQLite before Payload has finished booting. */
export async function getEmailSenderDefaultsFromDatabase(): Promise<EmailSenderDefaults | null> {
  try {
    const client = createClient({ url: resolveDatabaseUrl() })
    const { rows } = await client.execute(
      'SELECT sender_from_address, sender_from_name FROM email_settings LIMIT 1',
    )
    const row = rows[0] as Record<string, unknown> | undefined

    return toSenderDefaults({
      sender: {
        fromAddress:
          typeof row?.sender_from_address === 'string' ? row.sender_from_address : null,
        fromName: typeof row?.sender_from_name === 'string' ? row.sender_from_name : null,
      },
    })
  } catch {
    return null
  }
}
