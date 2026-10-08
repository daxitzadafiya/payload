import type { PayloadRequest } from 'payload'
import { formatAdminURL } from 'payload/shared'

import { buildPasswordResetEmailHtml } from '@/email/buildPasswordResetEmailHtml'
import { loadNotificationEmailBranding } from '@/email/loadNotificationEmailBranding'
import { getServerSideURL } from '@/utilities/getURL'

type ForgotPasswordEmailArgs = {
  req?: PayloadRequest
  token?: string
  user?: { email?: string | null }
}

export async function generateForgotPasswordEmailHTML(
  args?: ForgotPasswordEmailArgs,
): Promise<string> {
  const req = args?.req
  const token = args?.token

  if (!req || !token) {
    throw new Error('Missing request or token for forgot password email.')
  }

  const { payload, t } = req
  const config = payload.config

  const serverURL = getServerSideURL()
  const resetUrl = formatAdminURL({
    adminRoute: config.routes.admin,
    path: `${config.admin.routes.reset}/${token}`,
    serverURL,
  })

  const branding = await loadNotificationEmailBranding(payload)

  return buildPasswordResetEmailHtml({
    heading: t('authentication:resetYourPassword'),
    introText: t('authentication:youAreReceivingResetPassword'),
    resetUrl,
    buttonLabel: t('authentication:resetPassword'),
    ignoreText: t('authentication:youDidNotRequestPassword'),
    footerText: branding.siteName,
    logo: branding.logo,
    // Auth emails are HTML-only (no attachments), so use a public absolute URL.
    logoSrc: branding.logoAbsoluteSrc,
    theme: branding.theme,
  })
}

export async function generateForgotPasswordEmailSubject(
  args?: ForgotPasswordEmailArgs,
): Promise<string> {
  const req = args?.req

  if (!req) {
    throw new Error('Missing request for forgot password email subject.')
  }

  return req.t('authentication:resetYourPassword')
}
