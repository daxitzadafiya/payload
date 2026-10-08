import {
  isPropertyImageAttachment,
  isPublishedPropertyAttachment,
  type PropertyAttachment,
} from '@/utilities/optimaImage'

const attachmentOrder = (attachment: PropertyAttachment) => {
  if (typeof attachment.order === 'number' && Number.isFinite(attachment.order)) {
    return attachment.order
  }
  if (typeof attachment.order === 'string') {
    const parsed = Number(attachment.order)
    if (Number.isFinite(parsed)) return parsed
  }
  return Number.MAX_SAFE_INTEGER
}

const keepImageAttachments = (attachments: unknown[]): PropertyAttachment[] =>
  (attachments as PropertyAttachment[])
    .filter(isPublishedPropertyAttachment)
    .filter(isPropertyImageAttachment)
    .sort((a, b) => attachmentOrder(a) - attachmentOrder(b))

/** Drops PDFs and non-image documents from list payloads while keeping all published images. */
export function slimCRMListProperty(record: Record<string, unknown>): Record<string, unknown> {
  const slim: Record<string, unknown> = { ...record }

  for (const key of ['property_attachments', 'attachments'] as const) {
    const attachments = record[key]
    if (!Array.isArray(attachments)) continue
    slim[key] = keepImageAttachments(attachments)
  }

  return slim
}

export function slimCRMListProperties(properties: Record<string, unknown>[]): Record<string, unknown>[] {
  return properties.map(slimCRMListProperty)
}
