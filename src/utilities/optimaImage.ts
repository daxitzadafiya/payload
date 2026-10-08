import { getRuntimeOptimaImageConfig } from '@/settings/optimaCrm/client'

/** Card / list carousels — fits ~400px wide slots without loading 1000px assets */
export const PROPERTY_CARD_IMAGE_SIZE = 800
/** Property detail / lightbox — full quality */
export const PROPERTY_DETAIL_IMAGE_SIZE = 1000

type ResizeType = 'user' | 'property' | 'cms_medias'

export type PropertyAttachment = {
  model_id?: unknown
  model_name?: unknown
  file_md5_name?: unknown
  file_type?: unknown
  publish_status?: unknown
  document?: unknown
  order?: unknown
}

const stripTrailingSlash = (url: string) => url.replace(/\/$/, '')

const getFileNameFromPath = (value: string) => {
  const parts = value.split('/')
  return parts[parts.length - 1] || ''
}

const getImageExtension = (filename: string) => {
  const parts = filename.split('.')
  return (parts[parts.length - 1] || '').toLowerCase()
}

const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
  'bmp',
  'tif',
  'tiff',
  'heic',
  'heif',
])

const isTruthy = (value: unknown): boolean => {
  if (value === null || value === undefined || value === false) return false
  if (typeof value === 'string' && !value.trim()) return false
  if (typeof value === 'number' && value === 0) return false
  return true
}

const isDocumentFlag = (value: unknown): boolean => {
  if (value === true) return true
  if (value === 1 || value === '1') return true
  if (typeof value === 'string' && value.trim().toLowerCase() === 'true') return true
  return false
}

/** PHP: isset($pic['publish_status']) && !empty($pic['publish_status']) */
export const isPublishedPropertyAttachment = (attachment: PropertyAttachment): boolean =>
  isTruthy(attachment.publish_status)

const resolveAttachmentName = (attachment: unknown) => {
  if (!attachment) return ''
  if (typeof attachment === 'string') return getFileNameFromPath(attachment)
  if (typeof attachment !== 'object') return ''

  const asRecord = attachment as Record<string, unknown>
  const localizedFileName =
    asRecord.file_name && typeof asRecord.file_name === 'object'
      ? ((asRecord.file_name as Record<string, unknown>).EN ??
        (asRecord.file_name as Record<string, unknown>).en ??
        Object.values(asRecord.file_name as Record<string, unknown>).find(
          (value) => typeof value === 'string' && value.trim(),
        ))
      : undefined

  const preferredCandidates = [
    asRecord.file_md5_name,
    asRecord.file_name,
    localizedFileName,
    asRecord.name,
    asRecord.url,
    asRecord.file_url,
  ]

  for (const candidate of preferredCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return getFileNameFromPath(candidate)
    }
  }

  return ''
}

const asNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const getAttachmentModelId = (attachment: PropertyAttachment) => {
  if (typeof attachment.model_id === 'string' && attachment.model_id.trim()) {
    return attachment.model_id.trim()
  }
  if (typeof attachment.model_id === 'number' && Number.isFinite(attachment.model_id)) {
    return String(attachment.model_id)
  }
  return ''
}

const getAttachmentFileName = (attachment: PropertyAttachment) => {
  if (typeof attachment.file_md5_name === 'string' && attachment.file_md5_name.trim()) {
    return decodeURIComponent(attachment.file_md5_name.trim())
  }
  return resolveAttachmentName(attachment)
}

const getAttachmentModelName = (attachment: PropertyAttachment) => {
  if (typeof attachment.model_name === 'string' && attachment.model_name.trim()) {
    return attachment.model_name.trim()
  }
}

function resolveImageBaseForModel(modelName: string): string {
  const config = getRuntimeOptimaImageConfig()
  if (modelName === 'constructions_images') {
    return stripTrailingSlash(config.constructionsImageBase)
  }
  return stripTrailingSlash(config.commercialImageBase)
}

/** Append `{model_name}` when the CDN base does not already end with it. */
function joinModelBase(base: string, modelName: string): string {
  const normalized = stripTrailingSlash(base)
  return normalized.endsWith(`/${modelName}`) ? normalized : `${normalized}/${modelName}`
}

const getAttachmentFileType = (attachment: PropertyAttachment): string => {
  if (typeof attachment.file_type === 'string' && attachment.file_type.trim()) {
    return attachment.file_type.trim().toLowerCase()
  }
  const fileName = getAttachmentFileName(attachment)
  return getImageExtension(fileName)
}

/** PHP: isset($pic['document']) && $pic['document'] != 1 */
export const isPropertyImageAttachment = (attachment: PropertyAttachment): boolean => {
  const document = attachment.document
  if (isDocumentFlag(document)) return false

  const fileType = getAttachmentFileType(attachment)
  return IMAGE_EXTENSIONS.has(fileType)
}

/**
 * Builds a property attachment image URL (mirrors PHP attachment logic).
 *
 * - Resize, without watermark: `{property_img_resize_link}{model_name}/{model_id}/{image_size}/{file}`
 * - Resize, with watermark: `{image_base}/{model_name}/{agency_id}/{model_id}/{image_size}/{file}`
 * - Plain (documents): `{com_img}/{model_name}/{model_id}/{file}`
 */
export const buildPropertyAttachmentImageUrl = (
  attachment: PropertyAttachment,
  imageSize = 1000,
): string => {
  const modelName = getAttachmentModelName(attachment)
  const modelId = getAttachmentModelId(attachment)
  const fileName = getAttachmentFileName(attachment)
  if (!modelName || !modelId || !fileName) return ''

  if (imageSize > 0) {
    const config = getRuntimeOptimaImageConfig()
    if (config.propertyImages === 'with_watermark' && config.agencyId) {
      const imageBase = joinModelBase(resolveImageBaseForModel(modelName), modelName)
      return `${imageBase}/${config.agencyId}/${modelId}/${imageSize}/${fileName}`
    }

    const resizeBase = joinModelBase(config.propertyResizeBase, modelName)
    return `${resizeBase}/${modelId}/${imageSize}/${fileName}`
  }

  const comImg = joinModelBase(resolveImageBaseForModel(modelName), modelName)
  return `${comImg}/${modelId}/${fileName}`
}

/**
 * PHP-like resize helper for Optima images.
 * Mirrors existing ResizeImage behavior while centralizing fixed configuration.
 */
export const resizeOptimaImage = (
  url: string,
  size = 1200,
  type: ResizeType = 'cms_medias',
): string => {
  const trimmedUrl = (url || '').trim()
  if (!trimmedUrl) return ''

  if (type === 'user') {
    const fileName = getFileNameFromPath(trimmedUrl)
    return trimmedUrl.replace(fileName, `${size}/${fileName}`)
  }

  if (type === 'property') {
    if (trimmedUrl.startsWith('http')) {
      const urlParts = trimmedUrl.split('/')
      const fileName = urlParts.pop() || ''
      const beforeFile = urlParts.pop() || ''
      const prefix = `${urlParts.join('/')}/`
      return `${prefix}${size}/${fileName}`.replace(`/${beforeFile}/`, `/${size}/`)
    }

    return `${getRuntimeOptimaImageConfig().propertyResizeBase}/${size}/${trimmedUrl}`
  }

  const fileName = getFileNameFromPath(trimmedUrl)
  if (!fileName) return ''

  if (getImageExtension(fileName) === 'svg') {
    const config = getRuntimeOptimaImageConfig()
    return `${config.imageUrlWithoutResize}${config.siteId}/${fileName}`
  }

  const config = getRuntimeOptimaImageConfig()
  return `${config.imageUrl}${config.siteId}/${size}/${fileName}`
}

export const getOptimaPropertyAttachmentImage = (attachment: unknown, size = 1000): string => {
  if (!attachment || typeof attachment !== 'object') return ''
  const record = attachment as PropertyAttachment
  if (!isPropertyImageAttachment(record)) return ''
  return buildPropertyAttachmentImageUrl(record, size)
}

const getSortedPublishedPropertyImageAttachments = (attachments: unknown): PropertyAttachment[] => {
  if (!Array.isArray(attachments)) return []

  return (attachments as PropertyAttachment[])
    .filter(isPublishedPropertyAttachment)
    .filter(isPropertyImageAttachment)
    .sort(
      (a, b) =>
        asNumber(a.order, Number.MAX_SAFE_INTEGER) - asNumber(b.order, Number.MAX_SAFE_INTEGER),
    )
}

export const getPublishedPropertyAttachmentImages = (
  attachments: unknown,
  size = 1000,
): string[] => {
  return getSortedPublishedPropertyImageAttachments(attachments)
    .map((attachment) => buildPropertyAttachmentImageUrl(attachment, size))
    .filter((url) => Boolean(url))
}

export const getPublishedPropertyAttachmentImage = (attachments: unknown, size = 1000): string => {
  return getPublishedPropertyAttachmentImages(attachments, size)[0] || ''
}
