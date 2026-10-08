import { getLogoSources } from '@/components/Logo/getLogoSources'
import {
  resolveEmailThemeStyles,
  type NotificationEmailTheme,
} from '@/email/notificationEmailTheme'
import type { Logo } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

export type PasswordResetEmailContent = {
  heading: string
  introText: string
  resetUrl: string
  buttonLabel: string
  ignoreText: string
  footerText: string
  logo?: Logo | null
  /** Resolved logo src (`cid:…` for inline attachment, or absolute URL). */
  logoSrc?: string
  theme?: Partial<NotificationEmailTheme> | null
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function toAbsoluteUrl(path: string, serverURL: string): string {
  if (!path) return serverURL
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = serverURL.replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildPasswordResetEmailHtml(content: PasswordResetEmailContent): string {
  const serverURL = getServerSideURL()
  const logoSources = getLogoSources(content.logo)
  const logoUrl = content.logoSrc ?? toAbsoluteUrl(logoSources.lightSrc, serverURL)
  const { palette, fonts, googleFontsLink } = resolveEmailThemeStyles(content.theme)

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    ${googleFontsLink}
    <style>
      @media screen and (max-width: 600px) {
        .email-container { padding: 16px 8px !important; }
        .content-td { padding: 24px 20px !important; }
        .logo-td { padding: 24px 20px 20px !important; }
        .footer-td { padding: 20px 20px 24px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${palette.pageBackground};font-family:${fonts.body};color:${palette.textValue};">
    <table class="email-container" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${palette.pageBackground};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.04);background:${palette.cardBackground};">
            <tr>
              <td style="height:5px;background:linear-gradient(90deg,${palette.accent} 0%,${palette.accentLight} 50%,${palette.accent} 100%);font-size:0;line-height:0;" bgcolor="${palette.accent}">&nbsp;</td>
            </tr>
            <tr>
              <td class="logo-td" style="padding:36px 40px 28px;text-align:center;background:${palette.cardBackground};">
                <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(logoSources.alt)}" width="${logoSources.width}" height="${logoSources.height}" style="display:inline-block;max-width:200px;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px;background:${palette.cardBackground};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-bottom:1px solid ${palette.border};font-size:0;line-height:0;height:1px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="content-td" style="padding:32px 40px 12px;background:${palette.cardBackground};">
                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.3;color:${palette.textPrimary};font-family:${fonts.headline};font-weight:400;letter-spacing:0.3px;">${escapeHtml(content.heading)}</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:${palette.textMuted};font-family:${fonts.body};">${escapeHtml(content.introText)}</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="border-radius:8px;background:${palette.accent};">
                      <a href="${escapeHtml(content.resetUrl)}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:${palette.textOnAccent};text-decoration:none;font-family:${fonts.body};">${escapeHtml(content.buttonLabel)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${palette.textMuted};font-family:${fonts.body};">Or copy and paste this link into your browser:</p>
                <p style="margin:0 0 24px;font-size:12px;line-height:1.6;word-break:break-all;font-family:${fonts.body};">
                  <a href="${escapeHtml(content.resetUrl)}" style="color:${palette.accent};text-decoration:underline;">${escapeHtml(content.resetUrl)}</a>
                </p>
                <p style="margin:0;font-size:13px;line-height:1.7;color:${palette.textMuted};font-family:${fonts.body};">${escapeHtml(content.ignoreText)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px;background:${palette.cardBackground};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-bottom:1px solid ${palette.border};font-size:0;line-height:0;height:1px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="footer-td" style="padding:28px 40px 36px;background:${palette.footerBackground};">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${palette.textMuted};font-family:${fonts.body};">${escapeHtml(content.footerText)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
