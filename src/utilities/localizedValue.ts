type LocalizedRecord = Record<string, unknown>

const normalizeLocaleKey = (value: string) => value.toLowerCase().replace(/-/g, '_')

/** Optima CRM locale keys mapped from Payload / site locale codes */
const CRM_LOCALE_KEY_ALIASES: Record<string, string[]> = {
  en: ['en', 'en_us', 'EN', 'EN_US'],
  es: ['es_ar', 'es', 'ES', 'ES_AR'],
  de: ['de', 'DE'],
  fr: ['fr', 'FR'],
  it: ['it', 'IT'],
  nl: ['nl', 'NL'],
  el: ['el', 'gr', 'EL'],
  pt: ['pt', 'PT'],
  ca: ['ca', 'CA'],
  ro: ['ro', 'RO'],
  tr: ['tr', 'TR'],
  pl: ['po', 'pl', 'PO', 'PL'],
  da: ['da', 'dk', 'DA', 'DK'],
  no: ['no', 'NO'],
  sv: ['sv', 'SV'],
  fi: ['fi', 'FI'],
  cz: ['cz', 'CZ'],
  ru: ['ru', 'RU'],
}

export const buildCRMLocaleCandidates = (locale: string): string[] => {
  const safeLocale = (locale || 'en').trim()
  const normalized = normalizeLocaleKey(safeLocale)
  const language = normalized.split('_')[0] || 'en'
  const aliases = CRM_LOCALE_KEY_ALIASES[language] ?? []

  return Array.from(
    new Set([
      normalized,
      language,
      normalized.toUpperCase(),
      language.toUpperCase(),
      ...aliases.map(normalizeLocaleKey),
      ...aliases,
      'en',
      'en_us',
      'EN',
      'EN_US',
    ]),
  )
}

const buildLocaleCandidates = (locale: string) => buildCRMLocaleCandidates(locale)

const readLocalizedRecord = (value: unknown): Map<string, string> | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? new Map([['__plain__', trimmed]]) : null
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const normalizedMap = new Map<string, string>()
  for (const [key, candidate] of Object.entries(value as LocalizedRecord)) {
    if (normalizeLocaleKey(key) === 'undefined') continue
    if (typeof candidate === 'string' && candidate.trim()) {
      normalizedMap.set(normalizeLocaleKey(key), candidate)
    }
  }

  return normalizedMap.size > 0 ? normalizedMap : null
}

/**
 * Resolve translated text from CRM-style localized objects (EN/en_US/es_AR...).
 * If no locale match exists, returns the first non-empty string value.
 */
export const getLocalizedText = (
  value: unknown,
  locale = 'en',
  fallback = '',
): string => {
  const record = readLocalizedRecord(value)
  if (!record) return fallback

  if (record.has('__plain__')) {
    return record.get('__plain__') ?? fallback
  }

  for (const key of buildLocaleCandidates(locale)) {
    const found = record.get(normalizeLocaleKey(key))
    if (found) return found
  }

  for (const englishKey of ['en', 'en_us', 'EN', 'EN_US']) {
    const found = record.get(normalizeLocaleKey(englishKey))
    if (found) return found
  }

  for (const candidate of record.values()) {
    if (candidate.trim()) return candidate
  }

  return fallback
}

/** Alias — CRM API fields always use the same resolution rules as getLocalizedText. */
export const getCRMLocalizedText = getLocalizedText

const getNestedField = (source: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, source)
}

const pickFirstLocalized = (
  source: Record<string, unknown>,
  paths: string[],
  locale: string,
): string => {
  for (const path of paths) {
    const text = getCRMLocalizedText(getNestedField(source, path), locale)
    if (text) return text
  }
  return ''
}

export type CRMPropertyLocalizedTexts = {
  title: string
  description: string
  location: string
  city: string
  region: string
  propertyType: string
  propertySubtype: string
}

/** CRM booleans may arrive as true, 1, or "true". */
export const isCRMTruthy = (value: unknown): boolean => {
  if (value === true || value === 1) return true
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1'
  }
  return false
}

const resolveCRMPropertyDescription = (
  property: Record<string, unknown>,
  locale: string,
): string => {
  const isSale = isCRMTruthy(property.sale)
  const isRent = isCRMTruthy(property.rent)

  if (isSale) {
    return (
      pickFirstLocalized(property, ['sale_description', 'description', 'shared_data.description'], locale) ||
      pickFirstLocalized(property, ['rental_description', 'rent_description'], locale)
    )
  }

  if (isRent) {
    return (
      pickFirstLocalized(property, ['rent_description', 'rental_description', 'description'], locale) ||
      pickFirstLocalized(property, ['sale_description', 'shared_data.description'], locale)
    )
  }

  return pickFirstLocalized(
    property,
    ['description', 'sale_description', 'rent_description', 'rental_description', 'shared_data.description'],
    locale,
  )
}

const resolveCRMPropertyTitle = (property: Record<string, unknown>, locale: string): string => {
  const isSale = isCRMTruthy(property.sale)
  const isRent = isCRMTruthy(property.rent)

  if (isSale) {
    return (
      pickFirstLocalized(property, ['sale_title', 'title', 'shared_data.title'], locale) ||
      pickFirstLocalized(property, ['rental_title'], locale)
    )
  }

  if (isRent) {
    return (
      pickFirstLocalized(property, ['rental_title', 'rent_title', 'title'], locale) ||
      pickFirstLocalized(property, ['sale_title', 'shared_data.title'], locale)
    )
  }

  return pickFirstLocalized(
    property,
    ['sale_title', 'title', 'shared_data.title', 'rental_title'],
    locale,
  )
}

/**
 * Resolve common multi-language CRM property fields for the active site locale.
 */
export const resolveCRMPropertyLocalizedTexts = (
  property: Record<string, unknown>,
  locale: string,
): CRMPropertyLocalizedTexts => {
  const title = resolveCRMPropertyTitle(property, locale)
  const description = resolveCRMPropertyDescription(property, locale)

  const city =
    pickFirstLocalized(
      property,
      ['city_obj', 'city_value', 'property_city.value', 'property_city'],
      locale,
    ) || (typeof property.city_name === 'string' ? property.city_name : '')

  const region =
    pickFirstLocalized(property, ['region_obj', 'region_value', 'property_region.value'], locale) ||
    (typeof property.region_name === 'string' ? property.region_name : '')

  const location =
    pickFirstLocalized(
      property,
      ['location_value', 'location_obj', 'property_location.value'],
      locale,
    ) ||
    city ||
    region ||
    (typeof property.location_name === 'string' ? property.location_name : '') ||
    (typeof property.area_name === 'string' ? property.area_name : '') ||
    (typeof property.city_name === 'string' ? property.city_name : '') ||
    (typeof property.region_name === 'string' ? property.region_name : '')

  const propertyType =
    pickFirstLocalized(
      property,
      ['type_one_value', 'type_one_obj', 'property_type_one.value'],
      locale,
    ) || (typeof property.property_type === 'string' ? property.property_type : '')

  const propertySubtype =
    pickFirstLocalized(
      property,
      ['type_two_value', 'type_two_obj', 'property_type_two.value', 'type_two_name'],
      locale,
    ) || ''

  return {
    title,
    description,
    location,
    city,
    region,
    propertyType,
    propertySubtype,
  }
}
