import type { Payload } from 'payload'

import type { EmailLogoAttachment } from '@/email/resolveEmailLogoDataUri'

export type ConfiguredEmailMessage = {
  to: string
  subject: string
  html: string
  from?: string
  attachments?: EmailLogoAttachment[]
}

export async function sendConfiguredEmail(
  payload: Payload,
  message: ConfiguredEmailMessage,
): Promise<void> {
  await payload.sendEmail(message)
}
