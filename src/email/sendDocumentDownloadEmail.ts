import type { Payload } from 'payload'

import { buildDocumentDownloadEmailHtml } from '@/email/buildDocumentDownloadEmailHtml'
import { lexicalToEmailHtml } from '@/email/lexicalToEmailHtml'
import { loadNotificationEmailBranding } from '@/email/loadNotificationEmailBranding'
import { sendConfiguredEmail } from '@/email/sendConfiguredEmail'
import type { EmailSetting } from '@/payload-types'
import { getEmailSettings, isEmailConfigured } from '@/settings/email/server'
import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import {
  DOCUMENT_DOWNLOAD_ACTION_FIELD,
  DOCUMENT_DOWNLOAD_HERO_FIELD,
  DOCUMENT_DOWNLOAD_LABEL_FIELD,
  DOCUMENT_DOWNLOAD_PAGE_FIELD,
  DOCUMENT_DOWNLOAD_URL_FIELD,
} from '@/utilities/documentDownload'
import {
  createDocumentDownloadLink,
  isAllowedDocumentDownloadUrl,
} from '@/utilities/documentDownloadToken'
import {
  DISPLAY_REFERENCE_FIELD,
  PROJECT_REFERENCE_FIELD,
} from '@/utilities/propertyInquiry'
import { getServerSideURL } from '@/utilities/getURL'
import { t } from '@/utilities/translate'

type SubmissionField = {
  field: string
  value: string | boolean | number | null | undefined
}

const NAME_FIELDS = ['first_name', 'first-name', 'firstname', 'forename', 'firstName', 'name']

function fieldValue(submissionData: SubmissionField[], fieldName: string): string {
  const entry = submissionData.find((item) => item.field === fieldName)
  if (!entry || entry.value == null || typeof entry.value === 'boolean') return ''
  return String(entry.value).trim()
}

function visitorName(submissionData: SubmissionField[]): string {
  for (const fieldName of NAME_FIELDS) {
    const value = fieldValue(submissionData, fieldName)
    if (value) return value.split(/\s+/)[0] ?? value
  }
  return ''
}

function clientEmail(submissionData: SubmissionField[]): string | undefined {
  for (const entry of submissionData) {
    const fieldName = entry.field?.trim().toLowerCase()
    if (!fieldName || !['email', 'e-mail', 'client_email', 'client-email'].includes(fieldName)) {
      continue
    }
    const value = fieldValue(submissionData, entry.field)
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return value
  }
  return undefined
}

function applyTemplateVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '')
}

function stripBareDownloadUrl(html: string, downloadUrl: string): string {
  if (!downloadUrl) return html
  const escaped = downloadUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return html.replace(
    new RegExp(`<p>\\s*(?:<a[^>]*>\\s*)?${escaped}(?:\\s*</a>)?\\s*</p>`, 'gi'),
    '',
  )
}

function absoluteImageUrl(value: string): string | undefined {
  if (value.startsWith('https://') || value.startsWith('http://')) return value
  return undefined
}

function sameSiteUrl(pageUrl: string, siteUrl: string): string | undefined {
  try {
    const page = new URL(pageUrl)
    const site = new URL(siteUrl)
    if (page.protocol !== 'http:' && page.protocol !== 'https:') return undefined
    if (page.hostname !== site.hostname) return undefined
    return page.toString()
  } catch {
    return undefined
  }
}

export async function sendDocumentDownloadEmail({
  payload,
  locale,
  submissionData,
}: {
  payload: Payload
  locale: string
  submissionData: SubmissionField[]
}): Promise<void> {
  const settings = await getEmailSettings()
  if (!isEmailConfigured(settings)) return

  const to = clientEmail(submissionData)
  const sourceUrl = fieldValue(submissionData, DOCUMENT_DOWNLOAD_URL_FIELD)
  if (!to || !sourceUrl) return

  const crmSettings = await getOptimaCrmSettings()
  if (!isAllowedDocumentDownloadUrl(sourceUrl, crmSettings)) {
    payload.logger.error('Skipped document download email because the file URL is not allowed')
    return
  }

  const normalizedLocale = locale.trim().toLowerCase() || 'en'
  const siteUrl = getServerSideURL().replace(/\/$/, '')
  const token = await createDocumentDownloadLink({
    url: sourceUrl,
    pageUrl: fieldValue(submissionData, DOCUMENT_DOWNLOAD_PAGE_FIELD),
    filename: fieldValue(submissionData, DOCUMENT_DOWNLOAD_LABEL_FIELD),
  })
  const downloadUrl = `${siteUrl}/download/${token}`
  const pageUrl = sameSiteUrl(fieldValue(submissionData, DOCUMENT_DOWNLOAD_PAGE_FIELD), siteUrl)
  const documentLabel = fieldValue(submissionData, DOCUMENT_DOWNLOAD_LABEL_FIELD)
  const reference =
    fieldValue(submissionData, DISPLAY_REFERENCE_FIELD) ||
    fieldValue(submissionData, 'property') ||
    fieldValue(submissionData, PROJECT_REFERENCE_FIELD)
  const name = visitorName(submissionData)

  const [emailSettings, branding, copy] = await Promise.all([
    payload
      .findGlobal({
        slug: 'emailSettings',
        depth: 0,
        locale: normalizedLocale as 'en',
        fallbackLocale: 'en',
        overrideAccess: true,
      })
      .catch(() => null) as Promise<EmailSetting | null>,
    loadNotificationEmailBranding(payload),
    Promise.all([
      t('email.documentDownload.subject', normalizedLocale, 'Your document download link', payload),
      t('email.documentDownload.eyebrow', normalizedLocale, 'Your download is ready', payload),
      t('email.documentDownload.greeting', normalizedLocale, 'Hello', payload),
      t('email.documentDownload.button', normalizedLocale, 'Download document', payload),
      t(
        'email.documentDownload.copyLink',
        normalizedLocale,
        'Or copy this temporary download link',
        payload,
      ),
      t(
        'email.documentDownload.expiry',
        normalizedLocale,
        'Please download the file soon. After 30 minutes this link will expire and you will need to request it again.',
        payload,
      ),
      t('email.documentDownload.documentLabel', normalizedLocale, 'Document', payload),
      t('email.documentDownload.referenceLabel', normalizedLocale, 'Reference', payload),
      t('email.documentDownload.availabilityLabel', normalizedLocale, 'Availability', payload),
      t(
        'email.documentDownload.availabilityValue',
        normalizedLocale,
        'This link is valid for 30 minutes.',
        payload,
      ),
    ]),
  ])

  const [
    defaultSubject,
    eyebrow,
    greetingLabel,
    buttonLabel,
    copyLabel,
    expiryNotice,
    documentRowLabel,
    referenceLabel,
    availabilityLabel,
    availabilityValue,
  ] = copy
  const variables = {
    downloadUrl,
    action: fieldValue(submissionData, DOCUMENT_DOWNLOAD_ACTION_FIELD),
    document: documentLabel,
    pageUrl: pageUrl ?? '',
    reference,
  }
  const template = emailSettings?.clientConfirmation?.documentDownload
  const subject = applyTemplateVariables(template?.subject?.trim() || defaultSubject, variables)

  let footerHtml = ''
  if (template?.content) {
    footerHtml = stripBareDownloadUrl(
      applyTemplateVariables(await lexicalToEmailHtml(payload, template.content), variables),
      downloadUrl,
    ).trim()
  }

  const html = buildDocumentDownloadEmailHtml({
    eyebrow,
    greeting: name ? `${greetingLabel} ${name},` : `${greetingLabel},`,
    buttonLabel: documentLabel ? `${buttonLabel}` : buttonLabel,
    downloadUrl,
    copyLabel,
    expiryNotice,
    rows: [
      { label: documentRowLabel, value: documentLabel },
      { label: referenceLabel, value: reference, href: pageUrl },
      { label: availabilityLabel, value: availabilityValue },
    ],
    footerHtml,
    heroImageUrl: absoluteImageUrl(fieldValue(submissionData, DOCUMENT_DOWNLOAD_HERO_FIELD)),
    heroAlt: documentLabel || branding.siteName,
    heroHref: pageUrl || siteUrl,
    logo: branding.logo,
    logoSrc: branding.logoSrc,
    theme: branding.theme,
  })

  const sender = settings.sender!
  await sendConfiguredEmail(payload, {
    to,
    subject,
    html,
    from: `${sender.fromName} <${sender.fromAddress}>`,
    attachments: branding.logoAttachment ? [branding.logoAttachment] : undefined,
  })
}
