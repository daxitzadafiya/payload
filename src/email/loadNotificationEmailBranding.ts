import type { Payload } from 'payload'

import { parseThemeEmailColorsFromCustomCSS } from '@/globals/Theme/siteThemeTokens.mjs'
import type { NotificationEmailTheme } from '@/email/notificationEmailTheme'
import {
  resolveEmailLogo,
  type EmailLogoAttachment,
} from '@/email/resolveEmailLogoDataUri'
import type { Logo } from '@/payload-types'
import { getAppName } from '@/utilities/getAppName'
import { isGlobalTrashed } from '@/utilities/isGlobalTrashed'

export type NotificationEmailBranding = {
  theme: NotificationEmailTheme
  logo: Logo | null
  /** Prefer for senders that can attach `logoAttachment` (cid:… or absolute URL). */
  logoSrc: string
  /** Absolute URL for HTML-only mailers that cannot attach files. */
  logoAbsoluteSrc: string
  logoAttachment?: EmailLogoAttachment
  siteName: string
}

export async function loadNotificationEmailBranding(
  payload: Payload,
): Promise<NotificationEmailBranding> {
  const [themeGlobal, logo] = await Promise.all([
    payload.findGlobal({ slug: 'theme', overrideAccess: true }).catch(() => null),
    payload.findGlobal({ slug: 'logo', depth: 1, overrideAccess: true }).catch(() => null),
  ])

  const themeDoc = themeGlobal && !isGlobalTrashed(themeGlobal) ? themeGlobal : null
  const colors = parseThemeEmailColorsFromCustomCSS(themeDoc?.customCSS) as NotificationEmailTheme

  const theme: NotificationEmailTheme = {
    ...colors,
    fontMode: themeDoc?.fontMode ?? null,
    googleFonts: themeDoc?.googleFonts ?? null,
  }
  const resolvedLogo = await resolveEmailLogo(logo)

  return {
    theme,
    logo,
    logoSrc: resolvedLogo.src,
    logoAbsoluteSrc: resolvedLogo.absoluteSrc,
    logoAttachment: resolvedLogo.attachment,
    siteName: getAppName(logo),
  }
}
