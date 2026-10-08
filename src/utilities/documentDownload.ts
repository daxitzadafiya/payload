import type { Form } from '@/payload-types'

/** Hidden flag so the submission email can send the requested file link. */
export const DOCUMENT_DOWNLOAD_FLAG_FIELD = 'document_download'
export const DOCUMENT_DOWNLOAD_URL_FIELD = 'document_url'
export const DOCUMENT_DOWNLOAD_ACTION_FIELD = 'document_action'
export const DOCUMENT_DOWNLOAD_LABEL_FIELD = 'document_label'
export const DOCUMENT_DOWNLOAD_PAGE_FIELD = 'page_url'
export const DOCUMENT_DOWNLOAD_HERO_FIELD = 'document_hero_image'

export type DocumentDownloadKind = 'pdf' | 'plan' | 'document'

export type DocumentDownloadTarget = {
  url: string
  /** Button label the visitor clicked, already in the site language. */
  actionLabel: string
  /** Document name, already in the site language. */
  documentLabel: string
  /** Which download opened the modal, used for the heading copy. */
  kind: DocumentDownloadKind
}

export function downloadKindFromDocumentGroup(kind: string): DocumentDownloadKind {
  return kind === 'floor_plan' ? 'plan' : 'document'
}

export type DocumentDownloadRequest = DocumentDownloadTarget & {
  pageUrl: string
}

type HiddenField = { field: string; value: string }

export function buildDocumentDownloadCrmMessage(input: {
  lead: string
  actionLabel: string
  action: string
  documentLabel: string
  document: string
  urlLabel: string
  url: string
  pageLabel: string
  pageUrl: string
}): string {
  return [
    input.lead.trim(),
    `${input.actionLabel}: ${input.action.trim()}`,
    `${input.documentLabel}: ${input.document.trim()}`,
    `${input.urlLabel}: ${input.url.trim()}`,
    `${input.pageLabel}: ${input.pageUrl.trim()}`,
  ]
    .filter((line) => line.trim().length > 0)
    .join('\n')
}

export function resolveDownloadMessageFieldName(form?: Form | null): string {
  for (const field of form?.fields ?? []) {
    if (
      field &&
      typeof field === 'object' &&
      'blockType' in field &&
      field.blockType === 'textarea' &&
      'name' in field &&
      typeof field.name === 'string' &&
      field.name.trim()
    ) {
      return field.name
    }
  }

  return 'message'
}

/** Message is generated for CRM; the visitor does not type it in the modal. */
export function documentDownloadOmitFields(form?: Form | null): string[] {
  const names = new Set<string>(['message', 'comments', 'subject'])

  for (const field of form?.fields ?? []) {
    if (!field || typeof field !== 'object' || !('blockType' in field)) continue
    if (field.blockType !== 'textarea' && field.blockType !== 'message') continue
    if ('name' in field && typeof field.name === 'string' && field.name.trim()) {
      names.add(field.name)
    }
  }

  return [...names]
}

export function buildDocumentDownloadHiddenFields(input: {
  messageFieldName: string
  message: string
  request: DocumentDownloadRequest
  heroImageUrl?: string
}): HiddenField[] {
  const fields: HiddenField[] = [
    { field: input.messageFieldName, value: input.message },
    { field: DOCUMENT_DOWNLOAD_FLAG_FIELD, value: 'true' },
    { field: DOCUMENT_DOWNLOAD_URL_FIELD, value: input.request.url },
    { field: DOCUMENT_DOWNLOAD_ACTION_FIELD, value: input.request.actionLabel },
    { field: DOCUMENT_DOWNLOAD_LABEL_FIELD, value: input.request.documentLabel },
    { field: DOCUMENT_DOWNLOAD_PAGE_FIELD, value: input.request.pageUrl },
  ]

  const heroImageUrl = input.heroImageUrl?.trim()
  if (heroImageUrl) {
    fields.push({ field: DOCUMENT_DOWNLOAD_HERO_FIELD, value: heroImageUrl })
  }

  return fields
}
