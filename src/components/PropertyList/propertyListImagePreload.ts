import {
  getPublishedPropertyAttachmentImage,
  PROPERTY_CARD_IMAGE_SIZE,
} from '@/utilities/optimaImage'
import { unwrapCRMPropertyRecord } from '@/utilities/crmProperties'

const PRELOAD_IMAGE_COUNT = 6

export function extractPropertyListPreloadImageUrls(
  properties: Record<string, unknown>[],
): string[] {
  const urls: string[] = []

  for (const raw of properties) {
    if (urls.length >= PRELOAD_IMAGE_COUNT) break

    const record = unwrapCRMPropertyRecord(raw)
    const attachments = record.property_attachments ?? record.attachments
    const imageUrl = getPublishedPropertyAttachmentImage(attachments, PROPERTY_CARD_IMAGE_SIZE)

    if (imageUrl && !urls.includes(imageUrl)) {
      urls.push(imageUrl)
    }
  }

  return urls
}

export function extractImageOrigin(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}
