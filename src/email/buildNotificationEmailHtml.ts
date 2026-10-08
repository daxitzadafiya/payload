import { getLogoSources } from '@/components/Logo/getLogoSources'
import {
  resolveEmailThemeStyles,
  type NotificationEmailTheme,
} from '@/email/notificationEmailTheme'
import type { Logo } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

export type NotificationEmailField = {
  label: string
  value: string
}

export type NotificationEmailContent = {
  name: string
  contentHtml?: string
  fields: NotificationEmailField[]
  propertyReference?: string
  refLabel: string
  submittedAtLabel: string
  submittedAt: string
  footer: string
  logo?: Logo | null
  /** Resolved logo src (`cid:…` for inline attachment, or absolute URL). */
  logoSrc?: string
  siteName: string
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

export function buildNotificationEmailHtml(content: NotificationEmailContent): string {
  const serverURL = getServerSideURL()
  const logoSources = getLogoSources(content.logo)
  const logoUrl =
    content.logoSrc ?? toAbsoluteUrl(logoSources.lightSrc, serverURL)
  const { palette, fonts, googleFontsLink } = resolveEmailThemeStyles(content.theme)

  const fieldBlocks = content.fields
    .map(
      (field) => `
        <div class="field-card" style="margin-bottom:16px;background:${palette.cardBackground};border:1px solid ${palette.border};border-left:3px solid ${palette.accent};border-radius:6px;padding:16px 20px;box-shadow:0 4px 12px ${palette.accentShadow};">
          <div class="field-label" style="color:${palette.accent};font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:6px;font-family:${fonts.body};">${escapeHtml(field.label)}</div>
          <div class="field-value" style="color:${palette.textValue};font-size:14px;line-height:1.6;white-space:pre-wrap;font-family:${fonts.body};font-weight:400;">${escapeHtml(field.value)}</div>
        </div>`,
    )
    .join('')

  const referenceCallout = content.propertyReference
    ? `
        <div style="margin-bottom:16px;background:${palette.calloutBackground};border:1px solid ${palette.border};border-left:3px solid ${palette.accent};border-radius:6px;padding:16px 20px;box-shadow:0 4px 12px ${palette.accentShadow};">
          <div style="color:${palette.accent};font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:6px;font-family:${fonts.body};">${escapeHtml(content.refLabel)}</div>
          <div class="field-value" style="color:${palette.textValue};font-size:14px;line-height:1.6;white-space:pre-wrap;font-family:${fonts.body};font-weight:400;">${escapeHtml(content.propertyReference)}</div>
        </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    ${googleFontsLink}
    <!--[if mso]>
    <style>
      table { border-collapse: collapse; }
      td { font-family: Arial, Helvetica, sans-serif; }
    </style>
    <![endif]-->
    <style>
      @media screen and (max-width: 600px) {
        .email-container {
          padding: 16px 8px !important;
        }
        .main-card {
          border-radius: 8px !important;
        }
        .content-td {
          padding: 24px 20px 8px !important;
        }
        .logo-td {
          padding: 24px 20px 20px !important;
        }
        .fields-wrapper-td {
          padding: 0 20px 20px !important;
        }
        .footer-td {
          padding: 20px 20px 24px !important;
        }
        .divider-td {
          padding: 0 20px !important;
        }
      }
      .email-content img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 16px 0;
        border-radius: 6px;
      }
      .email-content p {
        margin: 0 0 14px;
      }
      .email-content a {
        color: ${palette.accent};
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${palette.pageBackground};font-family:${fonts.body};color:${palette.textValue};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <table class="email-container" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${palette.pageBackground};padding:40px 16px;">
      <tr>
        <td align="center">
          <!-- Main card -->
          <table class="main-card" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.04);background:${palette.cardBackground};">

            <!-- Premium Gold Gradient Accent Bar -->
            <tr>
              <td style="height:5px;background:linear-gradient(90deg,${palette.accent} 0%,${palette.accentLight} 50%,${palette.accent} 100%);font-size:0;line-height:0;" bgcolor="${palette.accent}">&nbsp;</td>
            </tr>

            <!-- Logo header -->
            <tr>
              <td class="logo-td" style="padding:36px 40px 28px;text-align:center;background:${palette.cardBackground};" bgcolor="${palette.cardBackground}">
                <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(logoSources.alt)}" width="${logoSources.width}" height="${logoSources.height}" style="display:inline-block;max-width:200px;height:auto;" />
              </td>
            </tr>

            <!-- Decorative gold divider -->
            <tr>
              <td class="divider-td" style="padding:0 40px;background:${palette.cardBackground};" bgcolor="${palette.cardBackground}">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-bottom:1px solid ${palette.border};font-size:0;line-height:0;height:1px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Heading & content -->
            <tr>
              <td class="content-td" style="padding:32px 40px 12px;background:${palette.cardBackground};" bgcolor="${palette.cardBackground}">
                <h1 style="margin:0 0 10px;font-size:28px;line-height:1.3;color:${palette.textPrimary};font-family:${fonts.headline};font-weight:400;letter-spacing:0.3px;">${escapeHtml(content.name)}</h1>
                ${
                  content.contentHtml
                    ? `<div class="email-content" style="margin:0 0 24px;font-size:14px;line-height:1.7;color:${palette.textMuted};font-family:${fonts.body};">${content.contentHtml}</div>`
                    : ''
                }
              </td>
            </tr>

            <!-- Fields & Callout section -->
            <tr>
              <td class="fields-wrapper-td" style="padding:0 40px 32px;background:${palette.cardBackground};" bgcolor="${palette.cardBackground}">
                <div class="fields-container">
                  ${referenceCallout}
                  ${fieldBlocks}
                </div>

                <!-- Submission timestamp footer card -->
                <div style="margin-top:24px;padding:14px 18px;background:${palette.timestampBackground};border-radius:8px;border:1px dashed ${palette.border};text-align:center;">
                  <span style="color:${palette.accent};font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;font-family:${fonts.body};">
                    ${escapeHtml(content.submittedAtLabel)}:
                  </span>
                  <span style="color:${palette.textMuted};font-size:12px;margin-left:6px;font-family:${fonts.body};font-weight:400;">
                    ${escapeHtml(content.submittedAt)}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Bottom divider -->
            <tr>
              <td class="divider-td" style="padding:0 40px;background:${palette.cardBackground};" bgcolor="${palette.cardBackground}">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-bottom:1px solid ${palette.border};font-size:0;line-height:0;height:1px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td class="footer-td" style="padding:28px 40px 36px;background:${palette.footerBackground};" bgcolor="${palette.footerBackground}">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${palette.textMuted};font-family:${fonts.body};">${escapeHtml(content.footer)}</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
