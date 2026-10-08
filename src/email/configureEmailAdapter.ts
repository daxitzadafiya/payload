import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import { dynamicEmailTransport } from '@/email/dynamicEmailTransport'
import { getEmailSenderDefaultsFromDatabase } from '@/email/getEmailSenderDefaults'

const senderDefaults = await getEmailSenderDefaultsFromDatabase()

/**
 * Pre-resolved Payload email adapter backed by admin-managed SMTP settings.
 * Default from name/address are read from Globals → Email settings when available.
 */
export const emailAdapter = await nodemailerAdapter({
  defaultFromAddress: senderDefaults?.defaultFromAddress ?? 'noreply@localhost',
  defaultFromName: senderDefaults?.defaultFromName ?? 'Horizon Estates',
  transport: dynamicEmailTransport,
  skipVerify: true,
})
