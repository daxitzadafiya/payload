/**
 * Optima CRM constructions / projects via Yii endpoint (pedro Developments style).
 *
 * List:  {contactUrl}?r=constructions&user=…&page=0&page_size=…&prop_phase_wise=true&…
 * Detail: {contactUrl}?r=constructions/view-by-ref&user=…&ref=…&status=Active
 */

import {
  extractCRMList,
  extractCRMTotal,
  unwrapCRMPropertyRecord,
  type CRMFetchResult,
  type PropertyListFilters,
} from '@/utilities/crmProperties'
import { getLocalizedText, isCRMTruthy } from '@/utilities/localizedValue'
import {
  buildPropertyAttachmentImageUrl,
  getOptimaPropertyAttachmentImage,
  getPublishedPropertyAttachmentImages,
  isPropertyImageAttachment,
  PROPERTY_CARD_IMAGE_SIZE,
  PROPERTY_DETAIL_IMAGE_SIZE,
  type PropertyAttachment,
} from '@/utilities/optimaImage'
import { resolveProjectDetailHref, resolvePropertyDetailHref } from '@/utilities/propertyUrl'
import { parseCountFilterValue } from '@/utilities/propertyFilterParsing'
import { resolveOptimaCrmSettings } from '@/settings/optimaCrm/client'
import { resolveProjectDisplayReference } from '@/settings/optimaCrm/shared'
import { formatPriceAmount } from '@/utilities/formatPriceAmount'

export type CRMProjectDetailRecord = Record<string, unknown>

const CONSTRUCTION_IMAGE_MODEL = 'constructions_images'
const DEFAULT_PROJECT_STATUS = 'Active'

const pickString = (candidate: unknown, fallback = '') =>
  typeof candidate === 'string' && candidate.trim() ? candidate.trim() : fallback

const pickNumber = (candidate: unknown): number | undefined => {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  if (typeof candidate === 'string') {
    const parsed = Number(candidate.replace(/[^\d.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

/** CRM often sends `0` when price is unknown — treat as missing for display. */
const pickPositivePrice = (value: unknown): number | undefined => {
  const n = pickNumber(value)
  return n != null && n > 0 ? n : undefined
}

/** Round distance for display: whole numbers without decimals, else up to 1 decimal. */
const formatDistanceNumber = (value: number): string => {
  const rounded = Math.round(value * 10) / 10
  if (Number.isInteger(rounded) || Math.abs(rounded - Math.round(rounded)) < 0.05) {
    return String(Math.round(rounded))
  }
  return rounded.toFixed(1).replace(/\.0$/, '')
}

/**
 * Display distance: convert ≥1000 m → km, round cleanly (e.g. 1000 meters → 1 km, 25.7 km → 25.7 km).
 */
function formatDistance(distance: unknown): string | undefined {
  let value: number | undefined
  let unit = 'km'

  if (typeof distance === 'string' && distance.trim()) {
    const trimmed = distance.trim()
    const match = trimmed.match(/^([\d.,]+)\s*(km|kilometers?|kilometres?|m|meters?|metres?)?$/i)
    if (match) {
      value = Number(match[1].replace(/,/g, ''))
      unit = (match[2] || 'km').toLowerCase()
    } else if (trimmed) {
      return trimmed
    }
  } else if (distance && typeof distance === 'object' && !Array.isArray(distance)) {
    const record = distance as Record<string, unknown>
    value = pickNumber(record.value)
    unit = pickString(record.unit, 'km').toLowerCase()
  }

  if (value == null || !Number.isFinite(value) || value <= 0) return undefined

  const isMeters = /^(m|meters?|metres?)$/i.test(unit)

  if (isMeters) {
    if (value >= 1000) {
      return `${formatDistanceNumber(value / 1000)} km`
    }
    return `${Math.round(value)} m`
  }

  // Treat unknown / km units as kilometers
  return `${formatDistanceNumber(value)} km`
}

function normalizeConstructionAttachments(attachments: unknown[]): PropertyAttachment[] {
  return attachments
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => {
      const attachment = { ...item } as PropertyAttachment & Record<string, unknown>
      if (!attachment.model_name) attachment.model_name = CONSTRUCTION_IMAGE_MODEL
      if (attachment.publish_status === undefined || attachment.publish_status === null) {
        attachment.publish_status = true
      }
      return attachment
    })
    .filter(isPropertyImageAttachment)
}

export type ProjectPhaseInfo = {
  constructionPhase: string
  priceFrom?: number
  priceFromLabel: string
  bedrooms?: number
  bathrooms?: number
  built?: number
  quantity?: number
}

export type ProjectAvailabilityUnit = {
  reference: string
  status?: string
  price?: number
  priceLabel: string
  bedrooms?: number
  bathrooms?: number
  built?: number
  pool: boolean
  terrace?: number | string
  garage: boolean
  plot?: number | string
  yearBuilt?: string
  deliveryLabel?: string
  imageUrl?: string
  floorPlans: string[]
  detailHref?: string
  type?: string
}

export type ProjectAvailabilityPhase = {
  phaseId: string
  phaseName: string
  type?: string
  bedroomsRange: string
  bathroomsRange: string
  minPrice?: number
  minPriceLabel: string
  units: ProjectAvailabilityUnit[]
}

export type NormalizedCRMProject = {
  id?: string
  reference?: string
  /** Admin-selected REF for UI; falls back to system reference when empty. */
  displayReference?: string
  title: string
  location: string
  city?: string
  description?: string
  imageUrl?: string
  imageUrls?: string[]
  detailHref?: string
  price: string
  priceValue?: number
  beds?: number
  baths?: number
  sqft?: number | string
  airportDistance?: string
  beachDistance?: string
  isKeyReady: boolean
  deliveryDate?: string
  deliveryLabel?: string
  phases: ProjectPhaseInfo[]
  availabilityPhases: ProjectAvailabilityPhase[]
  featured?: boolean
  crmStatus?: string
  latitude?: number
  longitude?: number
  raw: Record<string, unknown>
}

function pickProjectTitle(record: Record<string, unknown>, locale: string): string {
  const localizedTitle = getLocalizedText(record.title, locale, '').trim()
  if (localizedTitle) return localizedTitle
  const projectName = pickString(record.project_name)
  if (projectName) return projectName
  const permaLink = getLocalizedText(record.perma_link, locale, '').trim()
  if (permaLink) return permaLink
  return 'Project'
}

function pickProjectReference(record: Record<string, unknown>): string | undefined {
  for (const candidate of [record.reference, record.id, record._id, record.user_reference]) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate)
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return undefined
}

function deriveKeyReadyAndDelivery(phases: unknown[]): {
  isKeyReady: boolean
  deliveryDate?: string
  deliveryLabel?: string
} {
  let latest = ''
  for (const phase of phases) {
    if (!phase || typeof phase !== 'object') continue
    const date = pickString((phase as Record<string, unknown>).completion_date)
    if (!date) continue
    if (!latest || Date.parse(date) > Date.parse(latest)) latest = date
  }

  if (!latest) return { isKeyReady: false }

  const latestTime = Date.parse(latest)
  if (!Number.isFinite(latestTime)) return { isKeyReady: false, deliveryDate: latest }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isKeyReady = latestTime <= today.getTime()

  let deliveryLabel: string | undefined
  try {
    deliveryLabel = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(latestTime))
  } catch {
    deliveryLabel = latest
  }

  return { isKeyReady, deliveryDate: latest, deliveryLabel }
}

function parsePhaseInfos(source: Record<string, unknown>): ProjectPhaseInfo[] {
  const phaseWise = source.properties_phase_wise
  if (!Array.isArray(phaseWise) || phaseWise.length === 0) return []

  const phases: ProjectPhaseInfo[] = []
  for (const item of phaseWise) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const priceFrom = pickPositivePrice(row.current_price) ?? pickPositivePrice(row.price_from)
    const quantity =
      pickNumber(row.available_properties_count) ??
      pickNumber(row.quantaty) ??
      pickNumber(row.quantity)

    phases.push({
      constructionPhase: pickString(row.construction_phase, String(phases.length + 1)),
      priceFrom,
      priceFromLabel: priceFrom != null ? formatPriceAmount(priceFrom) : '',
      bedrooms: pickNumber(row.bedrooms),
      bathrooms: pickNumber(row.bathrooms),
      built: pickNumber(row.built) ?? pickNumber(row.built_size),
      quantity: quantity != null && quantity > 0 ? quantity : undefined,
    })
  }
  return phases
}

const FLOOR_PLAN_IDENTIFICATION_TYPES = new Set<string>([
  'FP',
  '118',
  '119',
  '120',
  '121',
  '122',
  '123',
  '124',
  '125',
  '130',
  '133',
  '134',
  '135',
  '136',
  '137',
  '138',
  '139',
  '140',
  '141',
  '142',
  '143',
  '144',
  '145',
  '146',
  '147',
])

const AVAILABILITY_THUMB_SIZE = 100

function isFloorPlanAttachment(attachment: Record<string, unknown>): boolean {
  const idType = attachment.identification_type
  if (idType == null) return false
  return FLOOR_PLAN_IDENTIFICATION_TYPES.has(String(idType))
}

function formatNumericRange(values: number[]): string {
  const sorted = [...new Set(values.filter((v) => Number.isFinite(v)))].sort((a, b) => a - b)
  if (sorted.length === 0) return ''
  if (sorted.length === 1) return String(sorted[0])
  return `${sorted[0]}-${sorted[sorted.length - 1]}`
}

function pickLocalizedTypeOne(
  rel: Record<string, unknown>,
  locale: string,
): string | undefined {
  const typeOne = rel.type_one_obj
  if (!typeOne || typeof typeOne !== 'object' || Array.isArray(typeOne)) return undefined
  const localized = getLocalizedText(typeOne as Record<string, unknown>, locale, '').trim()
  return localized || undefined
}

function formatDeliveryDate(value?: string): string | undefined {
  const raw = value?.trim()
  if (!raw) return undefined

  const parsed = Date.parse(raw)
  if (!Number.isFinite(parsed)) return raw

  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(parsed))
  } catch {
    return raw
  }
}

function parseRelatedProjectProperty(
  relRaw: Record<string, unknown>,
  locale: string,
): ProjectAvailabilityUnit {
  const rel = unwrapCRMPropertyRecord(relRaw)
  const attachments = Array.isArray(rel.property_attachments)
    ? rel.property_attachments
    : Array.isArray(relRaw.property_attachments)
      ? relRaw.property_attachments
      : []
  let imageUrl = ''
  const floorPlans: string[] = []

  for (const item of attachments) {
    if (!item || typeof item !== 'object') continue
    const att = item as PropertyAttachment & Record<string, unknown>
    const published =
      att.publish_status === 1 ||
      att.publish_status === true ||
      att.publish_status === '1' ||
      att.publish_status === undefined

    if (!published) continue

    if (!imageUrl && isPropertyImageAttachment(att)) {
      imageUrl = getOptimaPropertyAttachmentImage(att, AVAILABILITY_THUMB_SIZE)
    }

    if (isFloorPlanAttachment(att)) {
      const url = buildPropertyAttachmentImageUrl(att, 0)
      if (url) floorPlans.push(url)
    }
  }

  let pool = false
  if (rel.pool && typeof rel.pool === 'object' && !Array.isArray(rel.pool)) {
    pool = isCRMTruthy((rel.pool as Record<string, unknown>).pool)
  }

  let terrace: number | string | undefined
  if (Array.isArray(rel.terraces) && rel.terraces[0] && typeof rel.terraces[0] === 'object') {
    const terraceRow = rel.terraces[0] as Record<string, unknown>
    terrace = pickNumber(terraceRow.terrace) ?? pickString(terraceRow.terrace)
  }

  let garage = false
  const garageCount = pickNumber(rel.number_garages)
  if (garageCount != null && garageCount > 0) {
    garage = true
  } else if (rel.parking && typeof rel.parking === 'object' && !Array.isArray(rel.parking)) {
    garage = isCRMTruthy((rel.parking as Record<string, unknown>).garage)
  }

  const price = pickPositivePrice(rel.current_price) ?? pickPositivePrice(rel.price)
  const reference =
    pickString(String(rel.reference ?? '')) ||
    pickString(String(rel.id ?? '')) ||
    pickString(String(rel._id ?? ''))

  const yearBuilt = pickString(rel.year_built) || undefined

  return {
    reference,
    status: pickString(rel.status) || undefined,
    price,
    priceLabel: price != null ? formatPriceAmount(price) : '—',
    bedrooms: pickNumber(rel.bedrooms),
    bathrooms: pickNumber(rel.bathrooms),
    built: pickNumber(rel.built),
    pool,
    terrace,
    garage,
    plot: pickNumber(rel.plot) ?? pickString(rel.plot_size) ?? undefined,
    yearBuilt,
    deliveryLabel: formatDeliveryDate(yearBuilt),
    imageUrl: imageUrl || undefined,
    floorPlans,
    detailHref: resolvePropertyDetailHref(rel, locale, { listingMode: 'sale' }),
    type: pickLocalizedTypeOne(rel, locale),
  }
}

/** Group related_project_properties by construction phase (pedro projectDetailFormat). */
export function parseProjectAvailabilityPhases(
  source: Record<string, unknown>,
  locale: string,
  relatedOverride?: Record<string, unknown>[],
): ProjectAvailabilityPhase[] {
  const rawEnvelope =
    source._raw && typeof source._raw === 'object' && !Array.isArray(source._raw)
      ? (source._raw as Record<string, unknown>)
      : null

  const relatedRaw =
    (Array.isArray(relatedOverride) && relatedOverride.length > 0
      ? relatedOverride
      : null) ??
    source.related_project_properties ??
    rawEnvelope?.related_project_properties
  const phasesRaw = source.phase ?? source.phases ?? rawEnvelope?.phase ?? rawEnvelope?.phases

  if (!Array.isArray(relatedRaw) || relatedRaw.length === 0) return []
  if (!Array.isArray(phasesRaw) || phasesRaw.length === 0) {
    // No phase metadata — still show one accordion with all related units.
    const units = relatedRaw
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((rel) => parseRelatedProjectProperty(rel, locale))
      .filter((unit) => Boolean(unit.reference))

    if (units.length === 0) return []

    const bedroomValues = units
      .map((unit) => unit.bedrooms)
      .filter((value): value is number => value != null)
    const bathroomValues = units
      .map((unit) => unit.bathrooms)
      .filter((value): value is number => value != null)
    const prices = units
      .map((unit) => unit.price)
      .filter((value): value is number => value != null && value > 0)
    const minPrice = prices.length > 0 ? Math.min(...prices) : undefined

    return [
      {
        phaseId: 'all',
        phaseName: 'Availability',
        type: units.find((unit) => unit.type)?.type,
        bedroomsRange: formatNumericRange(bedroomValues),
        bathroomsRange: formatNumericRange(bathroomValues),
        minPrice,
        minPriceLabel: minPrice != null ? formatPriceAmount(minPrice) : '',
        units,
      },
    ]
  }

  const result: ProjectAvailabilityPhase[] = []

  for (const phaseItem of phasesRaw) {
    if (!phaseItem || typeof phaseItem !== 'object') continue
    const phase = phaseItem as Record<string, unknown>
    const phaseId =
      pickString(phase.phase_id) ||
      pickString(String(phase.phase_id ?? '')) ||
      pickString(phase.construction_phase) ||
      pickString(String(phase.construction_phase ?? ''))
    if (!phaseId) continue

    const phaseName =
      pickString(phase.phase_name) ||
      pickString(phase.construction_phase) ||
      `Phase ${phaseId}`

    const units: ProjectAvailabilityUnit[] = []
    const bedroomValues: number[] = []
    const bathroomValues: number[] = []

    for (const relItem of relatedRaw) {
      if (!relItem || typeof relItem !== 'object') continue
      const rel = relItem as Record<string, unknown>
      const relPhase =
        pickString(rel.construction_phase) ||
        pickString(String(rel.construction_phase ?? '')) ||
        pickString(rel.phase_id) ||
        pickString(String(rel.phase_id ?? ''))
      if (relPhase !== phaseId) continue

      const unit = parseRelatedProjectProperty(rel, locale)
      if (!unit.reference) continue
      units.push(unit)
      if (unit.bedrooms != null) bedroomValues.push(unit.bedrooms)
      if (unit.bathrooms != null) bathroomValues.push(unit.bathrooms)
    }

    if (units.length === 0) continue

    const prices = units
      .map((unit) => unit.price)
      .filter((value): value is number => value != null && value > 0)
    const minPrice = prices.length > 0 ? Math.min(...prices) : undefined

    result.push({
      phaseId,
      phaseName,
      type: units.find((unit) => unit.type)?.type,
      bedroomsRange: formatNumericRange(bedroomValues),
      bathroomsRange: formatNumericRange(bathroomValues),
      minPrice,
      minPriceLabel: minPrice != null ? formatPriceAmount(minPrice) : '',
      units,
    })
  }

  // If phase ids never matched, show all units in one group (pedro would hide them otherwise).
  if (result.length === 0) {
    const units = relatedRaw
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      .map((rel) => parseRelatedProjectProperty(rel, locale))
      .filter((unit) => Boolean(unit.reference))

    if (units.length === 0) return []

    const bedroomValues = units
      .map((unit) => unit.bedrooms)
      .filter((value): value is number => value != null)
    const bathroomValues = units
      .map((unit) => unit.bathrooms)
      .filter((value): value is number => value != null)
    const prices = units
      .map((unit) => unit.price)
      .filter((value): value is number => value != null && value > 0)
    const minPrice = prices.length > 0 ? Math.min(...prices) : undefined
    const firstPhase = phasesRaw.find((item) => item && typeof item === 'object') as
      | Record<string, unknown>
      | undefined

    return [
      {
        phaseId: 'all',
        phaseName:
          pickString(firstPhase?.phase_name) ||
          pickString(firstPhase?.construction_phase) ||
          'Availability',
        type: units.find((unit) => unit.type)?.type,
        bedroomsRange: formatNumericRange(bedroomValues),
        bathroomsRange: formatNumericRange(bathroomValues),
        minPrice,
        minPriceLabel: minPrice != null ? formatPriceAmount(minPrice) : '',
        units,
      },
    ]
  }

  return result
}

/**
 * Flatten a constructions API row into a property-shaped record (shared normalizers / inquiry).
 */
export function mapConstructionToPropertyRecord(
  raw: Record<string, unknown>,
  locale = 'en',
): Record<string, unknown> {
  const unwrapped = unwrapCRMPropertyRecord(raw)
  const source = { ...unwrapped }

  const topAttachments = raw.attachments ?? raw.property_attachments
  const nestedAttachments = source.attachments ?? source.property_attachments
  const attachmentsRaw = Array.isArray(topAttachments)
    ? topAttachments
    : Array.isArray(nestedAttachments)
      ? nestedAttachments
      : []
  const attachments = normalizeConstructionAttachments(attachmentsRaw)

  const phaseLow =
    pickPositivePrice(source.phase_low_price_from) ?? pickPositivePrice(source.price_from)
  const phaseHigh =
    pickPositivePrice(source.phase_heigh_price_from) ??
    pickPositivePrice(source.phase_high_price_from) ??
    pickPositivePrice(source.price_to)

  const bedrooms =
    pickNumber(source.bedrooms) ??
    pickNumber(source.bedrooms_from) ??
    pickNumber(source.beds)
  const bathrooms =
    pickNumber(source.bathrooms) ??
    pickNumber(source.bathrooms_from) ??
    pickNumber(source.baths)
  const built =
    pickNumber(source.built) ??
    pickNumber(source.built_size_from) ??
    pickNumber(source.built_from)

  const title = pickProjectTitle(source, locale)
  const numericId =
    pickNumber(source.reference) ??
    pickNumber(raw.reference) ??
    pickNumber(source.id)
  const reference = numericId != null ? String(numericId) : pickProjectReference(source)

  const phases = Array.isArray(source.phase) ? source.phase : []
  const { isKeyReady, deliveryDate } = deriveKeyReadyAndDelivery(phases)

  const mapped: Record<string, unknown> = {
    ...source,
    entityType: 'project',
    sale: true,
    project: true,
    title: source.title ?? title,
    project_name: source.project_name ?? title,
    display_name: title,
    name: title,
    description: source.description,
    reference,
    id: reference ?? source.id,
    _id: source._id ?? raw._id,
    bedrooms,
    bathrooms,
    beds: bedrooms,
    baths: bathrooms,
    built,
    phase_low_price_from: phaseLow,
    phase_heigh_price_from: phaseHigh,
    current_price: phaseLow,
    price: phaseLow,
    city: source.city ?? source.city_name ?? source.city_key,
    city_name: source.city_name ?? source.city,
    location: source.location ?? source.city_name ?? source.city,
    latitude: source.latitude ?? source.lat ?? source.alternative_latitude,
    longitude: source.longitude ?? source.lng ?? source.alternative_longitude,
    lat: source.latitude ?? source.lat ?? source.alternative_latitude,
    lng: source.longitude ?? source.lng ?? source.alternative_longitude,
    property_attachments: attachments,
    attachments,
    featured: isCRMTruthy(source.featured),
    status: pickString(source.status) || DEFAULT_PROJECT_STATUS,
    perma_link: source.perma_link,
    slug_all: source.slug_all,
    created_at: source.created_at ?? source.createdAt,
    properties_phase_wise: source.properties_phase_wise,
    phase: source.phase,
    is_key_ready: isKeyReady,
    delivery_date: deliveryDate,
    distance_airport: source.distance_airport,
    distance_sea: source.distance_sea,
    distance_beach: source.distance_beach,
    related_project_properties: source.related_project_properties,
    documents: source.documents ?? raw.documents,
    videos: source.videos ?? raw.videos,
    _raw: raw,
  }

  if (phaseLow == null && phaseHigh == null) mapped.price_on_demand = true
  return mapped
}

/** Normalize a constructions row for ProjectCard / ProjectDetail. */
export function normalizeCRMProject(
  raw: Record<string, unknown>,
  locale = 'en',
  options?: {
    attachmentImageSize?: number
    relatedProperties?: Record<string, unknown>[]
  },
): NormalizedCRMProject {
  const mapped = mapConstructionToPropertyRecord(raw, locale)
  const imageSize = options?.attachmentImageSize ?? PROPERTY_CARD_IMAGE_SIZE
  const attachments = Array.isArray(mapped.property_attachments)
    ? (mapped.property_attachments as PropertyAttachment[])
    : []
  const imageUrls = getPublishedPropertyAttachmentImages(attachments, imageSize)

  const phaseLow = pickPositivePrice(mapped.phase_low_price_from)
  const phaseHigh = pickPositivePrice(mapped.phase_heigh_price_from)
  let price = ''
  let priceValue = phaseLow
  if (phaseLow != null && phaseHigh != null && phaseHigh !== phaseLow) {
    price = `€${formatPriceAmount(phaseLow)} – €${formatPriceAmount(phaseHigh)}`
  } else if (phaseLow != null) {
    price = `€${formatPriceAmount(phaseLow)}`
  } else if (phaseHigh != null) {
    price = `€${formatPriceAmount(phaseHigh)}`
    priceValue = phaseHigh
  }

  const phases = parsePhaseInfos(mapped)
  const availabilityPhases = parseProjectAvailabilityPhases(
    mapped,
    locale,
    options?.relatedProperties,
  )
  const constructionPhases = Array.isArray(mapped.phase) ? mapped.phase : []
  const { isKeyReady, deliveryDate, deliveryLabel } = deriveKeyReadyAndDelivery(constructionPhases)

  const beds = pickNumber(mapped.bedrooms)
  const baths = pickNumber(mapped.bathrooms)
  const built = pickNumber(mapped.built)
  const title = pickProjectTitle(mapped, locale)
  const location =
    pickString(mapped.location) ||
    pickString(mapped.city_name) ||
    pickString(String(mapped.city ?? '')) ||
    'Greece'

  return {
    id: pickString(mapped._id) || pickString(String(mapped.id ?? '')),
    reference: pickString(String(mapped.reference ?? '')),
    displayReference:
      resolveProjectDisplayReference(
        mapped,
        resolveOptimaCrmSettings().projectReferenceField,
      ) || pickString(String(mapped.reference ?? '')) || undefined,
    title,
    location,
    city: pickString(mapped.city_name) || pickString(String(mapped.city ?? '')) || undefined,
    description:
      typeof mapped.description === 'string'
        ? mapped.description
        : getLocalizedText(mapped.description, locale, '') || undefined,
    imageUrl: imageUrls[0],
    imageUrls: imageUrls.length ? imageUrls : undefined,
    detailHref: resolveProjectDetailHref(mapped, locale),
    price,
    priceValue,
    beds,
    baths,
    sqft: built != null ? `${built}m²` : undefined,
    airportDistance: formatDistance(mapped.distance_airport),
    beachDistance: formatDistance(mapped.distance_sea) ?? formatDistance(mapped.distance_beach),
    isKeyReady: Boolean(mapped.is_key_ready) || isKeyReady,
    deliveryDate: pickString(mapped.delivery_date) || deliveryDate,
    deliveryLabel,
    phases,
    availabilityPhases,
    featured: isCRMTruthy(mapped.featured),
    crmStatus: pickString(mapped.status) || undefined,
    latitude: pickNumber(mapped.latitude) ?? pickNumber(mapped.lat),
    longitude: pickNumber(mapped.longitude) ?? pickNumber(mapped.lng),
    raw: mapped,
  }
}

function formatYiiDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** delivery months → phase_built_year=1970-01-01,{date} (pedro processFiltering). */
export function buildProjectDeliveryParam(delivery?: string): string | undefined {
  const value = delivery?.trim()
  if (!value || value === 'any') return undefined

  const months = Number(value)
  if (!Number.isFinite(months) || months <= 0) return undefined

  const date = new Date()
  if (months === 1) {
    date.setDate(date.getDate() - 1)
  } else {
    date.setMonth(date.getMonth() + months)
  }
  return `1970-01-01,${formatYiiDate(date)}`
}

/**
 * Distance meters → distances_sea (km + meters) + exclude_zero_distances=1
 * (pedro Developments::setQuery / user filter values).
 */
export function appendProjectSeaDistanceParams(
  params: URLSearchParams,
  distanceMeters?: string,
): void {
  const value = distanceMeters?.trim()
  if (!value || value === 'any' || value === '1000000') return

  const meters = Number(value.replace(/\D/g, ''))
  if (!Number.isFinite(meters) || meters <= 0) return

  const km = meters / 1000
  params.append('distances_sea', `${km},km`)
  params.append('distances_sea', `${meters},meters`)
  params.set('exclude_zero_distances', '1')
}

/** Yii orderby: orderby[]=field&orderby[]=DESC (not field,DESC). */
export function appendYiiOrderby(
  params: URLSearchParams,
  sortParams?: Record<string, unknown>,
): void {
  const entries = sortParams && Object.keys(sortParams).length > 0 ? Object.entries(sortParams) : []

  if (entries.length === 0) {
    // Default Relevance-style order from pedro sample
    params.append('orderby[]', 'featured')
    params.append('orderby[]', 'DESC')
    params.append('orderby[]', 'created_at')
    params.append('orderby[]', 'DESC')
    params.append('orderby[]', 'current_price')
    params.append('orderby[]', 'DESC')
    return
  }

  for (const [field, direction] of entries) {
    let yiiField = field
    const dirNum = Number(direction)
    const isAsc =
      direction === 'ASC' ||
      direction === 'asc' ||
      direction === 1 ||
      direction === '1' ||
      dirNum === 1

    if (field === 'current_price') {
      yiiField = isAsc ? 'phase_low_price_from' : 'phase_heigh_price_from'
    }

    params.append('orderby[]', yiiField)
    params.append('orderby[]', isAsc ? 'ASC' : 'DESC')
  }
}

export type ProjectListFilters = PropertyListFilters & {
  delivery?: string
  distanceToSea?: string
}

/**
 * Normalize constructions `latlng=true` response into map points.
 * Optima may return `{ [id]: [lat, lng], ... }` or a normal property list.
 */
export function normalizeConstructionLatLngMarkers(data: unknown): Array<{
  id: string
  reference: string
  lat: number
  lng: number
}> {
  if (!data || typeof data !== 'object') return []

  if (Array.isArray(data)) {
    const points: Array<{ id: string; reference: string; lat: number; lng: number }> = []
    for (const item of data) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue
      const row = item as Record<string, unknown>
      const lat = pickNumber(row.latitude)
      const lng = pickNumber(row.longitude)
      if (lat == null || lng == null || (lat === 0 && lng === 0)) continue
      const id =
        (typeof row._id === 'string' && row._id.trim()) ||
        (typeof row.id === 'string' && row.id.trim()) ||
        (row.reference != null ? String(row.reference).trim() : '')
      if (!id) continue
      const reference =
        row.reference != null && String(row.reference).trim()
          ? String(row.reference).trim()
          : id
      points.push({ id, reference, lat, lng })
    }
    return points
  }

  const record = data as Record<string, unknown>
  if (Array.isArray(record.properties) || Array.isArray(record.docs)) {
    return normalizeConstructionLatLngMarkers(extractCRMList(data))
  }

  const skipKeys = new Set(['total', 'totalDocs', 'total_properties', 'pagination', 'meta'])
  const points: Array<{ id: string; reference: string; lat: number; lng: number }> = []

  for (const [key, value] of Object.entries(record)) {
    if (!key || skipKeys.has(key)) continue

    if (Array.isArray(value) && value.length >= 2) {
      const lat = Number(value[0])
      const lng = Number(value[1])
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue
      points.push({ id: key, reference: key, lat, lng })
      continue
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const row = value as Record<string, unknown>
      const lat = pickNumber(row.latitude) ?? pickNumber(row.lat)
      const lng = pickNumber(row.longitude) ?? pickNumber(row.lng) ?? pickNumber(row.long)
      if (lat == null || lng == null || (lat === 0 && lng === 0)) continue
      const reference =
        row.reference != null && String(row.reference).trim()
          ? String(row.reference).trim()
          : key
      points.push({ id: key, reference, lat, lng })
    }
  }

  return points
}

/**
 * Build Yii query params for constructions list.
 * page is 0-indexed (UI page 1 → page=0).
 */
export function buildCRMProjectsSearchParams({
  page,
  pageSize,
  filters = {},
  sortParams,
  latlng,
}: {
  page: number
  pageSize: number
  filters?: ProjectListFilters
  sortParams?: Record<string, unknown>
  /** When true, ask constructions API for map coordinates only. */
  latlng?: boolean
}): URLSearchParams {
  const params = new URLSearchParams()
  const uiPage = Math.max(1, page)
  params.set('page', String(uiPage - 1))
  params.set('page_size', String(Math.max(1, pageSize)))
  params.set('prop_phase_wise', 'true')
  params.set('status', DEFAULT_PROJECT_STATUS)

  if (latlng) params.set('latlng', 'true')

  appendYiiOrderby(params, sortParams)

  for (const coast of filters.coast ?? []) {
    const key = coast.trim()
    if (key && key !== 'any' && key !== 'all') params.append('lg_by_key[]', key)
  }

  for (const city of filters.city ?? []) {
    const key = city.trim()
    if (key && key !== 'any' && key !== 'all') params.append('city[]', key)
  }

  for (const type of filters.propertyType ?? []) {
    const key = type.trim()
    if (key && key !== 'any') params.append('type[]', key)
  }

  const bedroomCount = parseCountFilterValue(filters.bedrooms, filters.bedroomsCustom)
  if (bedroomCount != null) {
    params.set('bedrooms', `${bedroomCount},50`)
  }

  const minPrice = filters.minPrice?.trim()
  const maxPrice = filters.maxPrice?.trim()
  if (minPrice && minPrice !== 'any') {
    params.set('phase_low_price_from', minPrice.replace(/[^\d]/g, ''))
  }
  if (maxPrice && maxPrice !== 'any') {
    params.set('phase_heigh_price_from', maxPrice.replace(/[^\d]/g, ''))
  }

  const search = filters.reference?.trim()
  if (search) {
    if (/^\d+$/.test(search)) {
      params.set('reference', search)
      params.set('search_all_references', '1')
    } else {
      params.set('project_name', search)
    }
  }

  const deliveryParam = buildProjectDeliveryParam(filters.delivery)
  if (deliveryParam) params.set('phase_built_year', deliveryParam)

  appendProjectSeaDistanceParams(params, filters.distanceToSea)

  const features = (filters.features ?? []).filter((f) => f && f !== 'any')
  if (features.length) {
    for (const feature of features) {
      const normalized = feature.toLowerCase()
      if (normalized === 'sea views' || normalized === 'sea') {
        params.append('views[]', 'sea')
      } else if (normalized === 'mountain') {
        params.append('views[]', 'mountain')
      } else if (normalized === 'golf') {
        params.append('views[]', 'golf')
        params.append('categories[]', 'golf')
        params.append('setting[]', 'close_to_golf')
        params.append('setting[]', 'frontline_golf')
      }
    }
    params.set('feature_or', 'true')
  }

  return params
}

/** @deprecated Prefer buildCRMProjectsSearchParams — kept for callers expecting a body shape. */
export function buildCRMProjectsQuery({
  page,
  pageSize,
  filters = {},
  sortParams,
}: {
  page: number
  pageSize: number
  filters?: ProjectListFilters
  sortParams?: Record<string, unknown>
}): Record<string, unknown> {
  const params = buildCRMProjectsSearchParams({ page, pageSize, filters, sortParams })
  return {
    options: {
      page: Math.max(1, page),
      limit: Math.max(1, pageSize),
      ...(sortParams && Object.keys(sortParams).length ? { sort: sortParams } : {}),
    },
    query: Object.fromEntries(params.entries()),
    _yiiSearchParams: params.toString(),
  }
}

function getYiiConfig(): { contactUrl: string; userKey: string } | null {
  const settings = resolveOptimaCrmSettings()
  const contactUrl = settings.contactUrl.trim()
  const userKey = settings.userKey.trim()
  if (!contactUrl || !userKey) return null
  return { contactUrl, userKey }
}

export function buildYiiConstructionsEndpoint(
  route: 'constructions' | 'constructions/view-by-ref',
  searchParams: URLSearchParams,
  config: { contactUrl: string; userKey: string },
): string {
  const base = config.contactUrl.replace(/\/+$/, '')
  const separator = base.includes('?') ? '&' : '?'
  const params = new URLSearchParams(searchParams)
  // `user` is required on Yii constructions (pedro / sample URL).
  if (!params.has('user')) params.set('user', config.userKey)
  return `${base}${separator}r=${route}&${params.toString()}`
}

export async function fetchCRMProjects({
  page = 1,
  pageSize = 11,
  filters,
  sortParams,
  signal,
  locale = 'en',
  latlng,
  projectIds,
  searchParams: overrideParams,
  body,
}: {
  page?: number
  pageSize?: number
  filters?: ProjectListFilters
  sortParams?: Record<string, unknown>
  signal?: AbortSignal
  locale?: string
  latlng?: boolean
  /** When set (map area search), POST body `{ project_ids }` like gestali Developments. */
  projectIds?: string[]
  searchParams?: URLSearchParams
  /** Legacy callers may pass `{ options, query, _yiiSearchParams }`. */
  body?: Record<string, unknown>
}): Promise<CRMFetchResult> {
  let params = overrideParams
  if (!params) {
    const yiiFromBody =
      typeof body?._yiiSearchParams === 'string' ? String(body._yiiSearchParams) : ''
    if (yiiFromBody) {
      params = new URLSearchParams(yiiFromBody)
      if (latlng && !params.has('latlng')) params.set('latlng', 'true')
    } else {
      params = buildCRMProjectsSearchParams({
        page,
        pageSize,
        filters,
        sortParams,
        latlng,
      })
    }
  } else if (latlng && !params.has('latlng')) {
    params.set('latlng', 'true')
  }

  const ids =
    projectIds?.map((id) => String(id).trim()).filter(Boolean) ??
    (Array.isArray(body?.project_ids)
      ? (body.project_ids as unknown[]).map((id) => String(id).trim()).filter(Boolean)
      : undefined)

  // Browser → Next proxy → Yii (avoids CORS on contactUrl)
  const response = await fetch('/api/crm/constructions', {
    method: 'POST',
    cache: 'no-store',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      _yiiSearchParams: params.toString(),
      locale,
      ...(ids?.length ? { project_ids: ids } : {}),
      ...(latlng || params.get('latlng') === 'true' ? { latlng: true } : {}),
    }),
  })

  if (!response.ok) {
    throw new Error(`CRM constructions API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const asRecord = data && typeof data === 'object' ? (data as Record<string, unknown>) : null

  if (latlng || params.get('latlng') === 'true') {
    const markers = Array.isArray(asRecord?.properties)
      ? (asRecord.properties as CRMFetchResult['properties'])
      : (normalizeConstructionLatLngMarkers(data) as unknown as CRMFetchResult['properties'])
    return { properties: markers, total: markers.length }
  }

  const properties = Array.isArray(asRecord?.properties)
    ? (asRecord.properties as Record<string, unknown>[])
    : extractCRMList(data)
  const total = extractCRMTotal(data, properties.length)

  return { properties, total }
}

/** GET constructions/view-by-ref via Next proxy → Yii. */
export async function fetchCRMProjectDetail(
  reference: string,
  options?: {
    statuses?: string[]
    locale?: string
    similarCommercials?: string
    init?: Omit<RequestInit, 'method' | 'body'>
  },
): Promise<CRMProjectDetailRecord | null> {
  const trimmedReference = reference.trim()
  if (!trimmedReference) return null

  const locale = options?.locale ?? 'en'
  const params = new URLSearchParams({
    ref: trimmedReference,
    locale,
    similar_commercials: options?.similarCommercials?.trim() || 'exclude_similar',
  })

  const endpoint = `/api/crm/constructions/view-by-ref?${params.toString()}`
  const { headers, ...restInit } = options?.init ?? {}

  const response = await fetch(endpoint, {
    ...restInit,
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  if (!response.ok) {
    console.error(`CRM project detail failed (${response.status}) for reference ${trimmedReference}`)
    return null
  }

  const data = (await response.json()) as unknown
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const record = data as CRMProjectDetailRecord
  if (record.reference == null && !record._id) return null
  return record
}

/**
 * Fetch commercial units for a construction (pedro Developments::getRelatedProjectProperties).
 * POST commercial_properties/commercial-construction?ref=
 */
export async function fetchCRMProjectRelatedProperties(
  reference: string,
  options?: { signal?: AbortSignal },
): Promise<Record<string, unknown>[]> {
  const trimmedReference = reference.trim()
  if (!trimmedReference) return []

  const response = await fetch('/api/crm/constructions/related-properties', {
    method: 'POST',
    cache: 'no-store',
    signal: options?.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: trimmedReference }),
  })

  if (!response.ok) {
    console.error(
      `CRM related project properties failed (${response.status}) for reference ${trimmedReference}`,
    )
    return []
  }

  const data = (await response.json()) as unknown
  if (!data || typeof data !== 'object' || Array.isArray(data)) return []

  const properties = (data as Record<string, unknown>).properties
  if (!Array.isArray(properties)) return []

  return properties.filter(
    (item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item),
  )
}

export { PROPERTY_CARD_IMAGE_SIZE, PROPERTY_DETAIL_IMAGE_SIZE }
