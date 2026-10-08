import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

import {
  getEmailSettings,
  isEmailConfigured,
  type ResolvedEmailSettings,
} from '@/settings/email/server'

type TransportCache = {
  transport: Transporter
  signature: string
}

let transportCache: TransportCache | null = null

export function invalidateEmailTransportCache(): void {
  transportCache?.transport.close()
  transportCache = null
}

function buildTransportSignature(settings: ResolvedEmailSettings): string {
  const smtp = settings.smtp
  const sender = settings.sender

  return JSON.stringify({
    enabled: settings.enabled,
    host: smtp?.host,
    port: smtp?.port,
    secure: smtp?.secure,
    user: smtp?.user,
    pass: smtp?.password,
    fromAddress: sender?.fromAddress,
    fromName: sender?.fromName,
  })
}

async function getOrCreateTransport(): Promise<Transporter> {
  const settings = await getEmailSettings()

  if (!isEmailConfigured(settings)) {
    throw new Error(
      'Email is not configured. Enable it under Globals → Email settings and fill in SMTP details.',
    )
  }

  const signature = buildTransportSignature(settings)

  if (transportCache?.signature === signature) {
    return transportCache.transport
  }

  invalidateEmailTransportCache()

  const smtp = settings.smtp!
  const transport = nodemailer.createTransport({
    host: smtp.host!,
    port: smtp.port ?? 587,
    secure: smtp.secure ?? false,
    auth: {
      user: smtp.user!,
      pass: smtp.password!,
    },
  })

  transportCache = { transport, signature }
  return transport
}

/**
 * Nodemailer transport that reads SMTP credentials from Globals → Email settings at send time.
 */
export const dynamicEmailTransport = {
  sendMail: async (mailOptions, callback) => {
    try {
      const transport = await getOrCreateTransport()
      const settings = await getEmailSettings()
      const sender = settings?.sender
      const from =
        mailOptions.from ??
        (sender?.fromName && sender?.fromAddress
          ? `${sender.fromName} <${sender.fromAddress}>`
          : undefined)

      const result = await transport.sendMail({
        ...mailOptions,
        from,
      })

      if (callback) {
        callback(null, result)
      }

      return result
    } catch (error) {
      if (callback) {
        callback(error as Error, undefined)
      }

      throw error
    }
  },
  verify: async (...args: Parameters<Transporter['verify']>) => {
    const transport = await getOrCreateTransport()
    return transport.verify(...args)
  },
  close: () => {
    invalidateEmailTransportCache()
  },
} as Transporter
