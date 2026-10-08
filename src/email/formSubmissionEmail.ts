import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { EmailSetting, Form, FormSubmission } from '@/payload-types'
import type { Locale } from '@/i18n/locales'
import type { Payload } from 'payload'

import { buildClientConfirmationEmailHtml } from '@/email/buildClientConfirmationEmailHtml'
import { buildNotificationEmailHtml } from '@/email/buildNotificationEmailHtml'
import { lexicalToEmailHtml } from '@/email/lexicalToEmailHtml'
import { loadNotificationEmailBranding } from '@/email/loadNotificationEmailBranding'
import { sendDocumentDownloadEmail } from '@/email/sendDocumentDownloadEmail'
import { getEmailSettings, isEmailConfigured } from '@/settings/email/server'
import { sendConfiguredEmail } from '@/email/sendConfiguredEmail'
import { getEmailFieldLabelMapping } from '@/utilities/formFieldLabels'
import {
  COMMERCIAL_PROFILE_TYPE_ONE_FIELD,
  COMMERCIAL_PROFILE_TYPE_TWO_FIELD,
  DISPLAY_REFERENCE_FIELD,
  PROJECT_REFERENCE_FIELD,
} from '@/utilities/propertyInquiry'
import {
  DOCUMENT_DOWNLOAD_ACTION_FIELD,
  DOCUMENT_DOWNLOAD_FLAG_FIELD,
  DOCUMENT_DOWNLOAD_HERO_FIELD,
  DOCUMENT_DOWNLOAD_LABEL_FIELD,
  DOCUMENT_DOWNLOAD_PAGE_FIELD,
  DOCUMENT_DOWNLOAD_URL_FIELD,
} from '@/utilities/documentDownload'
import {
  SAVE_SEARCH_FLAG_FIELD,
  SAVE_SEARCH_SUMMARY_FIELD,
} from '@/utilities/saveSearch'
import { HOLIDAY_CHECK_IN_HOUR, HOLIDAY_CHECK_OUT_HOUR } from '@/utilities/holidayStayTimes'
import { t } from '@/utilities/translate'

type SubmissionField = {
  field: string
  value: string | boolean | number | null | undefined
}

type NotificationTemplate =
  | 'contact'
  | 'propertyInquiry'
  | 'holidayBooking'
  | 'saveSearch'
  | 'documentDownload'

type NotificationField = {
  label: string
  value: string
}

type EmailTemplateConfig = {
  subject?: string | null
  content?: SerializedEditorState | null
}

type SendNotificationEmailArgs = {
  payload: Payload
  locale: string
  template: NotificationTemplate
  fields: NotificationField[]
  propertyReference?: string
  subjectSuffix?: string
  clientEmail?: string
  templateVariables?: Record<string, string>
}

const INTERNAL_FIELDS = new Set([
  '_id',
  'reference',
  'property',
  DISPLAY_REFERENCE_FIELD,
  PROJECT_REFERENCE_FIELD,
  'other_reference',
  'p_type',
  'interest',
  'assigned_to',
  'to_email',
  'transaction_types',
  COMMERCIAL_PROFILE_TYPE_ONE_FIELD,
  COMMERCIAL_PROFILE_TYPE_TWO_FIELD,
  'scp',
  'gdpr_status',
  'language',
  'comments',
  'recaptchaRequired',
  'recaptchaToken',
  'syncToOptimaCrm',
  'syncToOptimaOwners',
  'submissionLocale',
  SAVE_SEARCH_FLAG_FIELD,
  DOCUMENT_DOWNLOAD_FLAG_FIELD,
  DOCUMENT_DOWNLOAD_URL_FIELD,
  DOCUMENT_DOWNLOAD_ACTION_FIELD,
  DOCUMENT_DOWNLOAD_LABEL_FIELD,
  DOCUMENT_DOWNLOAD_PAGE_FIELD,
  DOCUMENT_DOWNLOAD_HERO_FIELD,
  'source',
  'cities',
  'lgroups',
  'countries',
  'budget_min',
  'budget_max',
  'min_bedrooms',
  'min_bathrooms',
  'feet_views',
  'feet_categories',
  'garden',
  'parking',
  'pool',
  'rent_from_date',
  'rent_to_date',
  'min_sleeps',
])

const EXCLUDED_FIELD_BLOCK_TYPES = new Set(['checkbox', 'message'])

const EMAIL_FIELD_NAMES = new Set(['email', 'e-mail', 'client_email', 'client-email'])

const TEMPLATE_DEFAULTS: Record<
  NotificationTemplate,
  { subject: string; name: string; intro: string }
> = {
  contact: {
    subject: 'New Contact Request',
    name: 'New Contact Request',
    intro: 'A new contact form submission has been received from your website.',
  },
  propertyInquiry: {
    subject: 'New Property Inquiry',
    name: 'New Property Inquiry',
    intro: 'A new property inquiry has been received from your website.',
  },
  holidayBooking: {
    subject: 'New Holiday Booking Enquiry',
    name: 'New Holiday Booking Enquiry',
    intro: 'A new holiday rental booking enquiry has been received from your website.',
  },
  saveSearch: {
    subject: 'New Save Search Request',
    name: 'New Save Search Request',
    intro: 'A visitor saved a property search and asked to be notified about matching listings.',
  },
  documentDownload: {
    subject: 'Document download request',
    name: 'Document download request',
    intro: 'A visitor requested a document download from your website.',
  },
}

const CLIENT_TEMPLATE_DEFAULTS: Record<NotificationTemplate, { subject: string }> = {
  contact: {
    subject: 'Thank you for your enquiry',
  },
  propertyInquiry: {
    subject: 'Enquiry about property (Ref: {{reference}})',
  },
  holidayBooking: {
    subject: 'Holiday booking enquiry (Ref: {{reference}})',
  },
  saveSearch: {
    subject: 'Thank you for saving your search',
  },
  documentDownload: {
    subject: 'Your document download link',
  },
}

function getSubmissionValue(
  submissionData: SubmissionField[] | null | undefined,
  fieldName: string,
): string {
  const entry = submissionData?.find((item) => item.field === fieldName)
  if (!entry) return ''

  const value = entry.value
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value).trim()
}

function isPropertyInquirySubmission(
  submissionData: SubmissionField[] | null | undefined,
): boolean {
  return Boolean(
    getSubmissionValue(submissionData, 'property') ||
    getSubmissionValue(submissionData, 'reference') ||
    getSubmissionValue(submissionData, PROJECT_REFERENCE_FIELD) ||
    getSubmissionValue(submissionData, DISPLAY_REFERENCE_FIELD),
  )
}

/** Prefer admin display REF for email callouts; fall back to CRM identity refs. */
function resolveEmailDisplayReference(
  submissionData: SubmissionField[] | null | undefined,
): string {
  return (
    getSubmissionValue(submissionData, DISPLAY_REFERENCE_FIELD) ||
    getSubmissionValue(submissionData, 'property') ||
    getSubmissionValue(submissionData, PROJECT_REFERENCE_FIELD) ||
    getSubmissionValue(submissionData, 'reference')
  )
}

function isDocumentDownloadSubmission(
  submissionData: SubmissionField[] | null | undefined,
): boolean {
  const flag = getSubmissionValue(submissionData, DOCUMENT_DOWNLOAD_FLAG_FIELD).toLowerCase()
  return flag === 'true' || flag === '1' || flag === 'yes'
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

async function buildDocumentDownloadFallbackHtml(
  payload: Payload,
  locale: string,
  variables: Record<string, string>,
): Promise<string> {
  const [intro, buttonLabel, actionLabel, documentLabel] = await Promise.all([
    t(
      'email.documentDownload.intro',
      locale,
      'Thank you. Use the link below to download the document you requested.',
      payload,
    ),
    t('email.documentDownload.button', locale, 'Download document', payload),
    t('downloadRequest.message.action', locale, 'Action', payload),
    t('downloadRequest.message.document', locale, 'Document', payload),
  ])

  const url = variables.downloadUrl?.trim() ?? ''
  const parts = [`<p>${escapeHtml(intro)}</p>`]

  if (variables.action?.trim()) {
    parts.push(
      `<p><strong>${escapeHtml(actionLabel)}:</strong> ${escapeHtml(variables.action.trim())}</p>`,
    )
  }

  if (variables.document?.trim()) {
    parts.push(
      `<p><strong>${escapeHtml(documentLabel)}:</strong> ${escapeHtml(variables.document.trim())}</p>`,
    )
  }

  if (url) {
    const safeUrl = escapeHtml(url)
    parts.push(`<p><a href="${safeUrl}">${escapeHtml(buttonLabel)}</a></p>`)
    parts.push(`<p>${safeUrl}</p>`)
  }

  return parts.join('')
}

function isSaveSearchSubmission(submissionData: SubmissionField[] | null | undefined): boolean {
  const flag = getSubmissionValue(submissionData, SAVE_SEARCH_FLAG_FIELD).toLowerCase()
  if (flag === 'true' || flag === '1' || flag === 'yes') return true
  if (getSubmissionValue(submissionData, SAVE_SEARCH_SUMMARY_FIELD)) return true
  return getSubmissionValue(submissionData, 'message').toLowerCase() === 'save search'
}

function getClientEmail(submissionData: SubmissionField[] | null | undefined): string | undefined {
  for (const entry of submissionData ?? []) {
    const fieldName = entry.field?.trim().toLowerCase()
    if (!fieldName || !EMAIL_FIELD_NAMES.has(fieldName)) continue

    const value = getSubmissionValue(submissionData, entry.field)
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return value
  }

  return undefined
}

function applyTemplateVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '')
}

function formatSubmittedAt(locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date())
  } catch {
    return new Date().toISOString()
  }
}

async function resolveFormTitle(payload: Payload, form: FormSubmission['form']): Promise<string> {
  if (typeof form === 'object' && form !== null && 'title' in form && form.title) {
    return form.title
  }

  if (typeof form === 'number') {
    try {
      const formDoc = await payload.findByID({
        collection: 'forms',
        id: form,
        depth: 0,
        overrideAccess: true,
      })
      return formDoc?.title ?? 'Form'
    } catch {
      return 'Form'
    }
  }

  return 'Form'
}

async function resolveFormDefinition(
  payload: Payload,
  form: FormSubmission['form'],
): Promise<Form | null> {
  if (typeof form === 'object' && form !== null && 'fields' in form) {
    return form as Form
  }

  if (typeof form === 'number') {
    try {
      return await payload.findByID({
        collection: 'forms',
        id: form,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      return null
    }
  }

  return null
}

type FormField = NonNullable<Form['fields']>[number]

function getFormField(form: Form | null, fieldName: string): FormField | undefined {
  for (const field of form?.fields ?? []) {
    if (field && typeof field === 'object' && 'name' in field && field.name === fieldName) {
      return field
    }
  }

  return undefined
}

function getFieldLabelFromForm(form: Form | null, fieldName: string): string | undefined {
  const field = getFormField(form, fieldName)
  if (field && 'label' in field && typeof field.label === 'string' && field.label.trim()) {
    return field.label
  }

  return undefined
}

function isExcludedEmailField(fieldName: string, form: Form | null): boolean {
  if (INTERNAL_FIELDS.has(fieldName)) return true

  const field = getFormField(form, fieldName)
  if (
    field &&
    'blockType' in field &&
    typeof field.blockType === 'string' &&
    EXCLUDED_FIELD_BLOCK_TYPES.has(field.blockType)
  ) {
    return true
  }

  return false
}

async function resolveFieldLabel(
  payload: Payload,
  fieldName: string,
  form: Form | null,
  locale: string,
): Promise<string> {
  const fromForm = getFieldLabelFromForm(form, fieldName)
  const mapped = getEmailFieldLabelMapping(fieldName, fromForm ?? undefined)
  return t(mapped.key, locale, mapped.fallback, payload)
}

function getClientTemplate(
  emailSettings: EmailSetting | null,
  template: NotificationTemplate,
): EmailTemplateConfig | null {
  const group = emailSettings?.clientConfirmation
  if (!group || typeof group !== 'object') return null

  const templateConfig = (group as Record<string, unknown>)[template]
  if (templateConfig && typeof templateConfig === 'object') {
    return templateConfig as EmailTemplateConfig
  }

  // Backward-compatible fallback before saveSearch template existed in admin.
  if (template === 'saveSearch') {
    const contactTemplate = group.contact
    if (contactTemplate && typeof contactTemplate === 'object') {
      return contactTemplate as EmailTemplateConfig
    }
  }

  return null
}

async function resolveTemplateContentHtml(
  payload: Payload,
  templateConfig: EmailTemplateConfig | null,
  fallbackIntro: string,
): Promise<string | undefined> {
  if (templateConfig?.content) {
    const html = await lexicalToEmailHtml(payload, templateConfig.content)
    if (html.trim()) return html
  }

  if (fallbackIntro.trim()) {
    return `<p>${fallbackIntro
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')}</p>`
  }

  return undefined
}

async function sendNotificationEmail({
  payload,
  locale,
  template,
  fields,
  propertyReference,
  subjectSuffix,
  clientEmail,
  templateVariables: extraTemplateVariables,
}: SendNotificationEmailArgs): Promise<void> {
  const settings = await getEmailSettings()
  if (!isEmailConfigured(settings)) return

  const normalizedLocale = (locale.trim().toLowerCase() || 'en') as Locale
  const defaults = TEMPLATE_DEFAULTS[template]
  const clientDefaults = CLIENT_TEMPLATE_DEFAULTS[template]

  const [emailSettings, branding] = await Promise.all([
    payload
      .findGlobal({
        slug: 'emailSettings',
        depth: 2,
        locale: normalizedLocale,
        fallbackLocale: 'en',
        overrideAccess: true,
      })
      .catch(() => null),
    loadNotificationEmailBranding(payload),
  ])

  const { logo, logoSrc, logoAttachment, theme } = branding
  const logoAttachments = logoAttachment ? [logoAttachment] : undefined

  const clientTemplate = getClientTemplate(emailSettings, template)

  const [refLabel, submittedAtLabel, footerText, siteName, teamName, teamSubjectRaw, teamIntro] =
    await Promise.all([
      t('email.notification.refLabel', normalizedLocale, 'Property Ref', payload),
      t('email.notification.submittedAt', normalizedLocale, 'Submitted at', payload),
      t(
        'email.notification.footer',
        normalizedLocale,
        'This message was sent automatically from your website contact system.',
        payload,
      ),
      t('email.notification.siteName', normalizedLocale, branding.siteName, payload),
      t(`email.notification.${template}.name`, normalizedLocale, defaults.name, payload),
      t(`email.notification.${template}.subject`, normalizedLocale, defaults.subject, payload),
      t(`email.notification.${template}.intro`, normalizedLocale, defaults.intro, payload),
    ])

  const templateVariables: Record<string, string> = {
    reference: propertyReference ?? '',
    ...extraTemplateVariables,
  }

  const teamSubject = applyTemplateVariables(teamSubjectRaw, templateVariables)
  const teamContentHtml = await resolveTemplateContentHtml(payload, null, teamIntro)

  const notificationHtml = buildNotificationEmailHtml({
    name: teamName,
    contentHtml: teamContentHtml,
    fields,
    propertyReference: propertyReference?.trim() || undefined,
    refLabel,
    submittedAtLabel,
    submittedAt: formatSubmittedAt(normalizedLocale),
    footer: footerText,
    logo,
    logoSrc,
    siteName,
    theme,
  })

  const sender = settings.sender!
  const recipient = settings.notifications!.recipientAddress!
  const emailSubject = subjectSuffix ? `${teamSubject} — ${subjectSuffix}` : teamSubject

  if (template !== 'documentDownload') {
    await sendConfiguredEmail(payload, {
      to: recipient,
      subject: emailSubject,
      html: notificationHtml,
      from: `${sender.fromName} <${sender.fromAddress}>`,
      attachments: logoAttachments,
    })
  }

  const downloadUrl = templateVariables.downloadUrl?.trim() ?? ''
  const forceClientEmail = template === 'documentDownload' && Boolean(downloadUrl)
  const clientConfirmation = emailSettings?.clientConfirmation
  if ((!clientConfirmation?.enabled && !forceClientEmail) || !clientEmail) return

  const defaultClientSubject =
    template === 'documentDownload'
      ? await t(
          'email.documentDownload.subject',
          normalizedLocale,
          clientDefaults.subject,
          payload,
        )
      : clientDefaults.subject

  const clientSubject = applyTemplateVariables(
    clientTemplate?.subject?.trim() || defaultClientSubject,
    templateVariables,
  )
  let clientContentHtml = applyTemplateVariables(
    (await resolveTemplateContentHtml(payload, clientTemplate, '')) ?? '',
    templateVariables,
  )

  if (template === 'documentDownload') {
    const fallbackHtml = await buildDocumentDownloadFallbackHtml(
      payload,
      normalizedLocale,
      templateVariables,
    )
    if (!clientContentHtml.trim()) {
      clientContentHtml = fallbackHtml
    } else if (downloadUrl && !clientContentHtml.includes(downloadUrl)) {
      clientContentHtml = `${clientContentHtml}${fallbackHtml}`
    }
  }

  const confirmationHtml = buildClientConfirmationEmailHtml({
    contentHtml: clientContentHtml || undefined,
    logo,
    logoSrc,
    theme,
  })

  await sendConfiguredEmail(payload, {
    to: clientEmail,
    subject: clientSubject,
    html: confirmationHtml,
    from: `${sender.fromName} <${sender.fromAddress}>`,
    attachments: logoAttachments,
  })
}

export async function sendFormSubmissionNotificationEmail({
  payload,
  doc,
}: {
  payload: Payload
  doc: FormSubmission
}): Promise<void> {
  const submissionData = (doc.submissionData ?? []) as SubmissionField[]
  const locale = (doc.submissionLocale as string | undefined)?.trim().toLowerCase() || 'en'
  const isDocumentDownload = isDocumentDownloadSubmission(submissionData)
  const isSaveSearch = !isDocumentDownload && isSaveSearchSubmission(submissionData)
  const isPropertyInquiry =
    !isDocumentDownload && !isSaveSearch && isPropertyInquirySubmission(submissionData)
  const template: NotificationTemplate = isSaveSearch
    ? 'saveSearch'
    : isPropertyInquiry
      ? 'propertyInquiry'
      : 'contact'

  if (isDocumentDownload) {
    await sendDocumentDownloadEmail({
      payload,
      locale,
      submissionData,
    })
    return
  }

  const [formTitle, formDefinition] = await Promise.all([
    resolveFormTitle(payload, doc.form),
    resolveFormDefinition(payload, doc.form),
  ])

  const visibleFields = submissionData.filter((entry) => {
    if (!entry?.field || isExcludedEmailField(entry.field, formDefinition)) return false
    // Gestali-style save-search mail focuses on contact details + search criteria.
    if (isSaveSearch && (entry.field === 'message' || entry.field === 'subject')) return false
    return Boolean(getSubmissionValue(submissionData, entry.field))
  })

  const fields = await Promise.all(
    visibleFields.map(async (entry) => ({
      label: await resolveFieldLabel(payload, entry.field, formDefinition, locale),
      value: getSubmissionValue(submissionData, entry.field),
    })),
  )

  const languageField = {
    label: await resolveFieldLabel(payload, 'language', formDefinition, locale),
    value: locale,
  }

  if (!fields.some((field) => field.label === languageField.label)) {
    fields.push(languageField)
  }

  if (isPropertyInquiry) {
    const transactionType = getSubmissionValue(submissionData, 'transaction_types')
    const enquiryType = await resolveEnquiryTypeLabel(
      transactionType || 'Buy',
      locale,
      payload,
    )
    fields.push({
      label: await resolveFieldLabel(payload, 'enquiry_type', formDefinition, locale),
      value: enquiryType,
    })
  }

  if (doc.syncToOptimaOwners) {
    const transactionType = getSubmissionValue(submissionData, 'transaction_types')
    const ownerIntentLabel =
      transactionType === 'rent'
        ? await t('email.notification.ownerIntent.rent', locale, 'Rent', payload)
        : transactionType === 'sale'
          ? await t('email.notification.ownerIntent.sale', locale, 'Sale', payload)
          : transactionType
    if (ownerIntentLabel) {
      fields.push({
        label: await t(
          'email.notification.ownerIntent.label',
          locale,
          'Rent or sale',
          payload,
        ),
        value: ownerIntentLabel,
      })
    }
  }

  const propertyReference = isPropertyInquiry
    ? resolveEmailDisplayReference(submissionData)
    : undefined

  await sendNotificationEmail({
    payload,
    locale,
    template,
    fields,
    propertyReference,
    subjectSuffix: formTitle,
    clientEmail: getClientEmail(submissionData),
  })
}

export type HolidayBookingEmailInput = {
  property_reference: string
  /** Admin display REF for email callout; falls back to property_reference. */
  display_reference?: string
  forename: string
  email: string
  mobile: string
  arrival: string
  departure: string
  surname?: string
  guests?: number
  message?: string
  locale?: string
  /** Total rental quote amount for the selected stay (optional). */
  price?: number | string
}

/** Maps CRM / form transaction types to the enquiry-type label shown in emails. */
export async function resolveEnquiryTypeLabel(
  transactionType: string | undefined,
  locale: string,
  payload: Payload,
): Promise<string> {
  const normalized = transactionType?.trim().toLowerCase() ?? ''
  if (normalized === 'buy' || normalized === 'sale') {
    return t('email.notification.enquiryType.sale', locale, 'Sale Property', payload)
  }
  if (
    normalized === 'short term rental' ||
    normalized === 'short-term rental' ||
    normalized === 'holiday' ||
    normalized === 'holiday rental'
  ) {
    return t('email.notification.enquiryType.holiday', locale, 'Holiday Property', payload)
  }
  if (
    normalized === 'long term rental' ||
    normalized === 'long-term rental' ||
    normalized === 'rent'
  ) {
    return t('email.notification.enquiryType.longTerm', locale, 'Long Term Property', payload)
  }
  return (
    transactionType?.trim() ||
    (await t('email.notification.enquiryType.holiday', locale, 'Holiday Property', payload))
  )
}

function padTimeHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

function formatHolidayDateTimeForEmail(value: string, hour: number): string {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return value.trim()
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  if (!Number.isFinite(date.getTime())) return value.trim()
  const datePart = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${datePart} at ${padTimeHour(hour)}`
}

function formatHolidayPriceForEmail(price?: number | string): string {
  if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
    return `€${Math.round(price).toLocaleString('en-US')}`
  }
  if (typeof price === 'string') {
    const trimmed = price.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('€')) return trimmed
    const numeric = Number(trimmed.replace(/[^\d.-]/g, ''))
    if (Number.isFinite(numeric) && numeric > 0) {
      return `€${Math.round(numeric).toLocaleString('en-US')}`
    }
    return trimmed
  }
  return ''
}

/** Team notification + client thank-you for holiday rental booking enquiries. */
export async function sendHolidayBookingNotificationEmail({
  payload,
  input,
}: {
  payload: Payload
  input: HolidayBookingEmailInput
}): Promise<void> {
  const locale = input.locale?.trim().toLowerCase() || 'en'
  const systemReference = input.property_reference.trim()
  const propertyReference =
    input.display_reference?.trim() || systemReference
  const forename = input.forename.trim()
  const surname = input.surname?.trim() ?? ''
  const email = input.email.trim()
  const mobile = input.mobile.trim()
  const arrival = input.arrival.trim()
  const departure = input.departure.trim()
  const message = input.message?.trim() ?? ''
  const guests =
    typeof input.guests === 'number' && Number.isFinite(input.guests) && input.guests > 0
      ? String(Math.floor(input.guests))
      : ''
  const priceDisplay = formatHolidayPriceForEmail(input.price)
  const enquiryType = await resolveEnquiryTypeLabel('short term rental', locale, payload)
  const holidaySubjectSuffix = await t(
    'email.notification.holidayBooking.subjectSuffix',
    locale,
    'Holiday rental',
    payload,
  )

  const arrivalDisplay = formatHolidayDateTimeForEmail(arrival, HOLIDAY_CHECK_IN_HOUR)
  const departureDisplay = formatHolidayDateTimeForEmail(departure, HOLIDAY_CHECK_OUT_HOUR)

  // Field order matches the ops checklist for holiday booking enquiry emails.
  // Prop. Ref is rendered via the dedicated property-reference callout.
  const rawFields: Array<{ field: string; value: string }> = [
    { field: 'forename', value: forename },
    { field: 'surname', value: surname },
    { field: 'email', value: email },
    { field: 'mobile', value: mobile },
    { field: 'language', value: locale },
    { field: 'enquiry_type', value: enquiryType },
    { field: 'arrival', value: arrivalDisplay },
    { field: 'departure', value: departureDisplay },
    { field: 'guests', value: guests },
    { field: 'message', value: message },
    { field: 'price', value: priceDisplay },
  ]

  const fields = await Promise.all(
    rawFields
      .filter((entry) => Boolean(entry.value))
      .map(async (entry) => ({
        label: await resolveFieldLabel(payload, entry.field, null, locale),
        value: entry.value,
      })),
  )

  await sendNotificationEmail({
    payload,
    locale,
    template: 'holidayBooking',
    fields,
    propertyReference,
    subjectSuffix: holidaySubjectSuffix,
    clientEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined,
    templateVariables: {
      arrival: arrivalDisplay,
      departure: departureDisplay,
      guests,
      price: priceDisplay,
      enquiry_type: enquiryType,
    },
  })
}
