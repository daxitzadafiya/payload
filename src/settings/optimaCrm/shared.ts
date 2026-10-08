import type { OptimaCrmSetting } from '@/payload-types'

export type SimilarCommercialsMode = 'include_similar' | 'only_similar' | 'exclude_similar'

export const SIMILAR_COMMERCIALS_MODES: SimilarCommercialsMode[] = [
  'include_similar',
  'only_similar',
  'exclude_similar',
]

export const DEFAULT_SIMILAR_COMMERCIALS: SimilarCommercialsMode = 'exclude_similar'

/** CRM keys that can be shown as property REF in lists/carousels/details. */
export type PropertyReferenceField = 'reference' | 'external_reference' | 'other_reference'

/** CRM keys that can be shown as project REF in lists/carousels/details. */
export type ProjectReferenceField = 'reference' | 'Agency_reference' | 'user_reference'

export const PROPERTY_REFERENCE_FIELDS: PropertyReferenceField[] = [
  'reference',
  'external_reference',
  'other_reference',
]

export const PROJECT_REFERENCE_FIELDS: ProjectReferenceField[] = [
  'reference',
  'Agency_reference',
  'user_reference',
]

export const DEFAULT_PROPERTY_REFERENCE_FIELD: PropertyReferenceField = 'reference'
export const DEFAULT_PROJECT_REFERENCE_FIELD: ProjectReferenceField = 'reference'

/** Gallery URL shape for property and project images. */
export type PropertyImageWatermarkMode = 'without_watermark' | 'with_watermark'

export const PROPERTY_IMAGE_WATERMARK_MODES: PropertyImageWatermarkMode[] = [
  'without_watermark',
  'with_watermark',
]

export const DEFAULT_PROPERTY_IMAGE_WATERMARK: PropertyImageWatermarkMode = 'without_watermark'

export type ResolvedOptimaCrmSettings = {
  apiUrl: string
  apiKey: string
  contactUrl: string
  userKey: string
  brochureTemplateId: string
  imageUrlWithoutResize: string
  imageUrl: string
  commercialImageBase: string
  constructionsImageBase: string
  agencyId: string
  propertyResizeBase: string
  siteId: string
  similarCommercials: SimilarCommercialsMode
  propertyReferenceField: PropertyReferenceField
  projectReferenceField: ProjectReferenceField
  propertyImages: PropertyImageWatermarkMode
}

export type OptimaImageConfig = Pick<
  ResolvedOptimaCrmSettings,
  | 'imageUrlWithoutResize'
  | 'imageUrl'
  | 'commercialImageBase'
  | 'constructionsImageBase'
  | 'agencyId'
  | 'propertyResizeBase'
  | 'siteId'
  | 'propertyImages'
>

export const IMAGE_DEFAULTS: OptimaImageConfig = {
  imageUrlWithoutResize: 'https://images.optima-crm.com/cms_medias/',
  imageUrl: 'https://images.optima-crm.com/resize/cms_medias/',
  commercialImageBase: 'https://images.optima-crm.com/commercial_images',
  constructionsImageBase: 'https://images.optima-crm.com/constructions_images',
  agencyId: '',
  propertyResizeBase: 'https://images.optima-crm.com/resize/',
  siteId: '237',
  propertyImages: DEFAULT_PROPERTY_IMAGE_WATERMARK,
}

export const EMPTY_OPTIMA_CRM_SETTINGS: ResolvedOptimaCrmSettings = {
  apiUrl: '',
  apiKey: '',
  contactUrl: '',
  userKey: '',
  brochureTemplateId: '39',
  ...IMAGE_DEFAULTS,
  similarCommercials: DEFAULT_SIMILAR_COMMERCIALS,
  propertyReferenceField: DEFAULT_PROPERTY_REFERENCE_FIELD,
  projectReferenceField: DEFAULT_PROJECT_REFERENCE_FIELD,
}

function pickString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

function pickBrochureTemplateId(value: unknown, fallback: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value.trim()
  return fallback
}

/** NestJS hosts — MODE selects DEV vs PROD base. */
export type CrmApiMode = 'dev' | 'prod'

/**
 * Paths that use NestJS base (MODE).
 * - `properties` and nested (`properties/view-by-ref`, …)
 * - `commercial_properties` and all nested routes (`find-all`, `commercial-construction`, …)
 * Project/constructions detail stays on Yii contact URL.
 */
export function usesNestCrmApiBase(path: string): boolean {
  const resource = path.replace(/^\/+|\/+$/g, '')
  if (resource === 'commercial_properties' || resource.startsWith('commercial_properties/')) {
    return true
  }
  if (resource === 'properties' || resource.startsWith('properties/')) return true
  return false
}

/** Same-origin proxy paths for browser listing calls (exact list endpoints only). */
export function isNestCrmListingPath(path: string): boolean {
  const resource = path.replace(/^\/+|\/+$/g, '')
  return resource === 'properties' || resource === 'commercial_properties'
}

export function getCrmApiMode(): CrmApiMode {
  const raw = (process.env.NEXT_PUBLIC_CRM_API_MODE ?? 'prod').trim().toLowerCase()
  return raw === 'dev' ? 'dev' : 'prod'
}

/**
 * NestJS CRM base, selected by NEXT_PUBLIC_CRM_API_MODE.
 * Host only — no `/v3` suffix (unlike legacy NEXT_NODE_URL).
 */
export function getNestCrmApiBaseUrl(): string {
  const mode = getCrmApiMode()
  const fromEnv =
    mode === 'dev'
      ? process.env.NEXT_PUBLIC_CRM_NEST_API_URL_DEV
      : process.env.NEXT_PUBLIC_CRM_NEST_API_URL_PROD
  return pickString(fromEnv, '').replace(/\/+$/, '')
}

/** Yii host (`index.php`). PDF brochures and Yii routes. Account creation uses the Nest API. */
export function getYiiContactUrl(): string {
  const fromEnv =
    getCrmApiMode() === 'dev'
      ? process.env.NEXT_PUBLIC_CRM_API_URL_DEV
      : process.env.NEXT_PUBLIC_CRM_API_URL_PROD
  return pickString(fromEnv, '')
}

/**
 * Pick API base for a CRM path.
 * - NestJS paths → MODE host when configured
 * - everything else → legacy `NEXT_NODE_URL` (settings.apiUrl)
 */
export function resolveCrmApiBaseUrl(path: string, legacyApiUrl: string): string {
  const legacy = legacyApiUrl.replace(/\/+$/, '')
  if (usesNestCrmApiBase(path)) {
    const nestBase = getNestCrmApiBaseUrl()
    if (nestBase) return nestBase
  }
  return legacy
}

/**
 * API credentials + Image CDN from ENV (not Payload admin).
 */
export function readOptimaCrmEnvConfig(): Pick<
  ResolvedOptimaCrmSettings,
  | 'apiUrl'
  | 'apiKey'
  | 'contactUrl'
  | 'userKey'
  | 'brochureTemplateId'
  | 'imageUrlWithoutResize'
  | 'imageUrl'
  | 'commercialImageBase'
  | 'constructionsImageBase'
  | 'agencyId'
  | 'propertyResizeBase'
  | 'siteId'
> {
  const defaults = EMPTY_OPTIMA_CRM_SETTINGS

  return {
    apiUrl: pickString(process.env.NEXT_NODE_URL, defaults.apiUrl),
    apiKey: pickString(process.env.NEXT_PUBLIC_CRM_API_KEY, defaults.apiKey),
    contactUrl: pickString(getYiiContactUrl(), defaults.contactUrl),
    userKey: pickString(process.env.NEXT_PUBLIC_OPTIMA_USER_KEY, defaults.userKey),
    brochureTemplateId: pickBrochureTemplateId(
      process.env.NEXT_PUBLIC_OPTIMA_BROCHURE_TEMPLATE_ID,
      defaults.brochureTemplateId,
    ),
    imageUrlWithoutResize: pickString(
      process.env.NEXT_PUBLIC_OPTIMA_IMAGE_URL_WITHOUT_RESIZE,
      defaults.imageUrlWithoutResize,
    ),
    imageUrl: pickString(process.env.NEXT_PUBLIC_OPTIMA_IMAGE_URL, defaults.imageUrl),
    commercialImageBase: pickString(
      process.env.NEXT_PUBLIC_OPTIMA_COMMERCIAL_IMAGE_BASE,
      defaults.commercialImageBase,
    ),
    constructionsImageBase: pickString(
      process.env.NEXT_PUBLIC_OPTIMA_CONSTRUCTIONS_IMAGE_BASE,
      defaults.constructionsImageBase,
    ),
    agencyId: pickString(process.env.NEXT_PUBLIC_OPTIMA_AGENCY_ID, defaults.agencyId),
    propertyResizeBase: pickString(
      process.env.NEXT_PUBLIC_OPTIMA_PROPERTY_RESIZE_BASE,
      defaults.propertyResizeBase,
    ),
    siteId: pickString(process.env.NEXT_PUBLIC_OPTIMA_SITE_ID, defaults.siteId),
  }
}

function pickSimilarCommercials(
  value: unknown,
  fallback: SimilarCommercialsMode,
): SimilarCommercialsMode {
  if (
    typeof value === 'string' &&
    SIMILAR_COMMERCIALS_MODES.includes(value as SimilarCommercialsMode)
  ) {
    return value as SimilarCommercialsMode
  }
  return fallback
}

function pickPropertyReferenceField(
  value: unknown,
  fallback: PropertyReferenceField,
): PropertyReferenceField {
  if (
    typeof value === 'string' &&
    PROPERTY_REFERENCE_FIELDS.includes(value as PropertyReferenceField)
  ) {
    return value as PropertyReferenceField
  }
  return fallback
}

function pickProjectReferenceField(
  value: unknown,
  fallback: ProjectReferenceField,
): ProjectReferenceField {
  if (
    typeof value === 'string' &&
    PROJECT_REFERENCE_FIELDS.includes(value as ProjectReferenceField)
  ) {
    return value as ProjectReferenceField
  }
  return fallback
}

function pickPropertyImageWatermark(
  value: unknown,
  fallback: PropertyImageWatermarkMode,
): PropertyImageWatermarkMode {
  if (
    typeof value === 'string' &&
    PROPERTY_IMAGE_WATERMARK_MODES.includes(value as PropertyImageWatermarkMode)
  ) {
    return value as PropertyImageWatermarkMode
  }
  return fallback
}

export function similarCommercialsQueryClause(
  settings: Pick<ResolvedOptimaCrmSettings, 'similarCommercials'> = EMPTY_OPTIMA_CRM_SETTINGS,
): { similar_commercials: SimilarCommercialsMode } {
  return { similar_commercials: settings.similarCommercials }
}

/** Read a CRM reference-like value as a display string. */
export function pickCrmReferenceValue(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const raw = record[key]
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
  }
  return undefined
}

/**
 * Resolve the REF shown in UI for a property.
 * Preferred admin field first; falls back to system `reference` when empty.
 */
export function resolvePropertyDisplayReference(
  record: Record<string, unknown>,
  preferred: PropertyReferenceField = DEFAULT_PROPERTY_REFERENCE_FIELD,
): string | undefined {
  const preferredKeys = preferred === 'reference' ? ['reference'] : [preferred]
  return (
    pickCrmReferenceValue(record, preferredKeys) ||
    pickCrmReferenceValue(record, ['reference'])
  )
}

/**
 * Resolve the REF shown in UI for a project.
 * Preferred admin field first; falls back to system `reference` when empty.
 */
export function resolveProjectDisplayReference(
  record: Record<string, unknown>,
  preferred: ProjectReferenceField = DEFAULT_PROJECT_REFERENCE_FIELD,
): string | undefined {
  const preferredKeys =
    preferred === 'Agency_reference'
      ? ['Agency_reference', 'agency_reference']
      : [preferred]
  return (
    pickCrmReferenceValue(record, preferredKeys) ||
    pickCrmReferenceValue(record, ['reference'])
  )
}

/** UI helper: prefer displayReference, else system reference. */
export function getShownReference(entity: {
  displayReference?: string
  reference?: string
}): string {
  return (entity.displayReference || entity.reference || '').trim()
}

export function resolveOptimaCrmSettingsFromGlobal(
  doc: OptimaCrmSetting | null | undefined,
): ResolvedOptimaCrmSettings {
  const properties = doc?.properties
  const reference = doc?.reference
  const imageDisplay = doc?.imageDisplay
  const defaults = EMPTY_OPTIMA_CRM_SETTINGS
  const fromEnv = readOptimaCrmEnvConfig()

  return {
    ...fromEnv,
    similarCommercials: pickSimilarCommercials(
      properties?.similarCommercials,
      defaults.similarCommercials,
    ),
    propertyReferenceField: pickPropertyReferenceField(
      reference?.propertyField,
      defaults.propertyReferenceField,
    ),
    projectReferenceField: pickProjectReferenceField(
      reference?.projectField,
      defaults.projectReferenceField,
    ),
    propertyImages: pickPropertyImageWatermark(
      imageDisplay?.propertyImages,
      defaults.propertyImages,
    ),
  }
}
