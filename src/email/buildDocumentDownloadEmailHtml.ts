import { getLogoSources } from '@/components/Logo/getLogoSources'
import {
  resolveEmailThemeStyles,
  type NotificationEmailTheme,
} from '@/email/notificationEmailTheme'
import type { Logo } from '@/payload-types'

export type DocumentDownloadEmailRow = {
  label: string
  value: string
  href?: string
}

export type DocumentDownloadEmailContent = {
  eyebrow: string
  greeting: string
  buttonLabel: string
  downloadUrl: string
  copyLabel: string
  expiryNotice: string
  rows: DocumentDownloadEmailRow[]
  /** Admin template, rendered under the availability row. */
  footerHtml?: string
  heroImageUrl?: string
  heroAlt: string
  heroHref?: string
  logo?: Logo | null
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

export function buildDocumentDownloadEmailHtml(content: DocumentDownloadEmailContent): string {
  const { palette, fonts, googleFontsLink } = resolveEmailThemeStyles(content.theme)
  const logoSources = getLogoSources(content.logo)
  const logoUrl = content.logoSrc ?? logoSources.lightSrc
  const downloadUrl = escapeHtml(content.downloadUrl)
  const hero = content.heroImageUrl?.trim()
  const heroHref = content.heroHref?.trim()
  const heroImage = hero
    ? `<img src="${escapeHtml(hero)}" alt="${escapeHtml(content.heroAlt)}" width="640" style="display:block;width:100%;max-width:640px;height:240px;object-fit:cover;border:0;" />`
    : ''
  const heroHtml = heroImage
    ? `<tr>
        <td style="padding:0 0 8px;line-height:0;font-size:0;">
          ${heroHref ? `<a href="${escapeHtml(heroHref)}" style="text-decoration:none;">${heroImage}</a>` : heroImage}
        </td>
      </tr>`
    : ''

  const rowsHtml = content.rows
    .filter((row) => row.value.trim())
    .map((row) => {
      const value = row.href
        ? `<a href="${escapeHtml(row.href)}" style="color:${palette.accent};text-decoration:none;font-weight:600;">${escapeHtml(row.value)}</a>`
        : escapeHtml(row.value)
      return `<tr>
        <td style="padding:14px 16px;border-bottom:1px solid ${palette.border};font-family:${fonts.body};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${palette.textMuted};width:38%;">${escapeHtml(row.label)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid ${palette.border};font-family:${fonts.body};font-size:15px;line-height:1.5;color:${palette.textValue};font-weight:600;">${value}</td>
      </tr>`
    })
    .join('')

  const footerHtml = content.footerHtml?.trim()
    ? `<div style="margin-top:8px;padding-top:22px;border-top:1px solid ${palette.border};font-family:${fonts.body};font-size:15px;line-height:1.7;color:${palette.textMuted};">${content.footerHtml}</div>`
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
        .logo-td { padding: 24px 20px 20px !important; }
        .content-td { padding: 24px 20px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${palette.pageBackground};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.eyebrow)}</div>
    <table class="email-container" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${palette.pageBackground};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.04);background:${palette.cardBackground};">
            <tr>
              <td style="height:5px;background:linear-gradient(90deg,${palette.accent} 0%,${palette.accentLight} 50%,${palette.accent} 100%);font-size:0;line-height:0;" bgcolor="${palette.accent}">&nbsp;</td>
            </tr>
            <tr>
              <td class="logo-td" style="padding:36px 40px 28px;text-align:center;background:${palette.cardBackground};" bgcolor="${palette.cardBackground}">
                <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(logoSources.alt)}" width="${logoSources.width}" height="${logoSources.height}" style="display:inline-block;max-width:200px;height:auto;border:0;" />
              </td>
            </tr>
            ${heroHtml}
            <tr>
              <td class="content-td" style="padding:32px 40px 36px;text-align:left;background:${palette.cardBackground};" bgcolor="${palette.cardBackground}">
                <p style="margin:0 0 14px;font-family:${fonts.body};font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${palette.accent};">${escapeHtml(content.eyebrow)}</p>
                <h1 style="margin:0 0 16px;font-family:${fonts.headline};font-size:32px;font-weight:400;line-height:1.2;color:${palette.textPrimary};">${escapeHtml(content.greeting)}</h1>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px;">
                  <tr>
                    <td bgcolor="${palette.accent}" style="border-radius:8px;background:${palette.accent};">
                      <a href="${downloadUrl}" style="display:inline-block;padding:14px 28px;font-family:${fonts.body};font-size:13px;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;color:${palette.textOnAccent};font-weight:600;">${escapeHtml(content.buttonLabel)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 6px;font-family:${fonts.body};font-size:13px;line-height:1.5;color:${palette.textMuted};">${escapeHtml(content.copyLabel)}</p>
                <p style="margin:0 0 22px;font-family:${fonts.body};font-size:13px;line-height:1.5;word-break:break-all;"><a href="${downloadUrl}" style="color:${palette.accent};text-decoration:underline;">${downloadUrl}</a></p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
                  <tr>
                    <td style="padding:16px 18px;background:${palette.calloutBackground};border-radius:10px;font-family:${fonts.body};font-size:14px;line-height:1.6;color:${palette.textValue};">${escapeHtml(content.expiryNotice)}</td>
                  </tr>
                </table>
                ${rowsHtml ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid ${palette.border};margin:0;">${rowsHtml}</table>` : ''}
                ${footerHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
