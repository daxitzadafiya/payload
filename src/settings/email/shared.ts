export type ResolvedEmailSettings = {
  enabled?: boolean | null
  smtp?: {
    host?: string | null
    port?: number | null
    secure?: boolean | null
    user?: string | null
    password?: string | null
  } | null
  sender?: {
    fromAddress?: string | null
    fromName?: string | null
  } | null
  notifications?: {
    recipientAddress?: string | null
  } | null
}

export function isEmailConfigured(
  settings: ResolvedEmailSettings | null | undefined,
): settings is ResolvedEmailSettings {
  if (!settings?.enabled) return false

  const smtp = settings.smtp
  const sender = settings.sender
  const notifications = settings.notifications

  return Boolean(
    smtp?.host &&
      smtp.port &&
      smtp.user &&
      smtp.password &&
      sender?.fromAddress &&
      sender.fromName &&
      notifications?.recipientAddress,
  )
}
