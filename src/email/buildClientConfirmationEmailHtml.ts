import { getLogoSources } from '@/components/Logo/getLogoSources'
import {
  resolveEmailThemeStyles,
  type NotificationEmailTheme,
} from '@/email/notificationEmailTheme'
import type { Logo } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

export type ClientConfirmationEmailContent = {
  contentHtml?: string
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

export function buildClientConfirmationEmailHtml(content: ClientConfirmationEmailContent): string {
  const serverURL = getServerSideURL()
  const logoSources = getLogoSources(content.logo)
  const logoUrl =
    content.logoSrc ?? toAbsoluteUrl(logoSources.lightSrc, serverURL)
  const { palette, fonts, googleFontsLink } = resolveEmailThemeStyles(content.theme)

  const bodyHtml = content.contentHtml
    ? `<div class="email-content" style="font-size:14px;line-height:1.8;color:${palette.textMuted};font-family:${fonts.body};">${content.contentHtml}</div>`
    : ''

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
      }
      .email-content p { margin: 0 0 14px; }
      .email-content > p:first-child {
        margin: 0 0 16px;
        font-family: ${fonts.headline};
        font-size: 28px;
        font-weight: 400;
        line-height: 1.3;
        color: ${palette.textPrimary};
        font-style: normal;
      }
      .email-content > p:first-child strong,
      .email-content > p:first-child em {
        font-family: inherit;
        font-weight: 400;
        font-style: normal;
        color: inherit;
      }
      .email-content ul,
      .email-content ol {
        margin: 0 0 14px;
        padding-left: 24px;
      }
      .email-content li { margin: 0 0 8px; }
      .email-content strong { font-weight: 700; }
      .email-content em { font-style: italic; }
      .email-content h1,
      .email-content h2,
      .email-content h3 {
        margin: 0 0 16px;
        font-family: ${fonts.headline};
        font-weight: 400;
        line-height: 1.3;
        color: ${palette.textPrimary};
      }
      .email-content h1 { font-size: 28px; }
      .email-content h2 { font-size: 24px; }
      .email-content h3 { font-size: 20px; }
      .email-content a { color: ${palette.accent}; }
      .email-content img {
        height: auto;
        vertical-align: middle;
      }
      .email-content p img,
      .email-content li img {
        display: inline-block;
        width: 18px;
        max-width: 18px;
        margin: 0 10px 0 0;
      }
      .email-content > figure img,
      .email-content > p:only-child > img:only-child {
        display: block;
        max-width: 100%;
        width: auto;
        margin: 16px 0;
        border-radius: 6px;
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
              <td class="content-td" style="padding:32px 40px 36px;background:${palette.cardBackground};">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
