import type { ContactSectionBlock, Page } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export type ContactOfficeLocation = {
  id?: string | null
  title: string
  label?: string | null
  city: string
  address?: string | null
  phone?: string | null
  email?: string | null
  imageUrl?: string | null
  lat: number
  lon: number
}

function isValidCoordinate(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function officeToLocation(
  office: NonNullable<ContactSectionBlock['offices']>[number],
): ContactOfficeLocation | null {
  if (!isValidCoordinate(office.lat) || !isValidCoordinate(office.lon)) return null

  const address = office.addressLines
    ?.map((line) => line?.line?.trim())
    .filter(Boolean)
    .join(', ')

  const title = [office.city, address].filter(Boolean).join(' — ') || 'Office'
  const image = office.image
  const imageUrl =
    image && typeof image === 'object' && image.url
      ? getMediaUrl(image.url, image.updatedAt)
      : null

  return {
    id: office.id,
    title,
    label: office.label,
    city: office.city,
    address,
    phone: office.phone,
    email: office.email,
    imageUrl,
    lat: office.lat,
    lon: office.lon,
  }
}

export function extractContactOfficeLocations(
  blocks: Page['layout'] | null | undefined,
): ContactOfficeLocation[] {
  if (!blocks?.length) return []

  return blocks
    .filter((block): block is ContactSectionBlock => block.blockType === 'contactSectionBlock')
    .flatMap((block) => (block.offices || []).map(officeToLocation))
    .filter((location): location is ContactOfficeLocation => location !== null)
}
