export type CRMAmenity = {
  key: string
  label: string
  icon: string
}

const humanizeAmenityKey = (key: string): string =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()

const collectTruthyKeys = (source: unknown): string[] => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return []

  return Object.entries(source as Record<string, unknown>)
    .filter(([, value]) => value === true)
    .map(([key]) => key)
}

/** Collect enabled amenities from CRM feature groups. Icon keys map to Lucide in PropertyDetailIcon. */
export function normalizeCRMAmenities(property: Record<string, unknown>): CRMAmenity[] {
  const keys = new Set<string>([
    ...collectTruthyKeys(property.categories),
    ...collectTruthyKeys(property.settings),
    ...collectTruthyKeys(property.orientation),
    ...collectTruthyKeys(property.views),
    ...collectTruthyKeys(property.condition),
    ...collectTruthyKeys(property.distances),
    ...collectTruthyKeys(property.custom_fields),
    ...collectTruthyKeys(property.kitchen),
    ...collectTruthyKeys(property.living_room),
    ...collectTruthyKeys(property.security),
    ...collectTruthyKeys(property.utility),
    ...collectTruthyKeys(property.furniture),
    ...collectTruthyKeys(property.climate_control),
    ...collectTruthyKeys(property.parking),
    ...collectTruthyKeys(property.garden),
    ...collectTruthyKeys(property.pool),
    ...collectTruthyKeys(property.leisures),
    ...collectTruthyKeys(property.features),
    ...collectTruthyKeys(property.rooms),
  ])

  return Array.from(keys)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => ({
      key,
      label: humanizeAmenityKey(key),
      icon: key,
    }))
}

export type { CRMPropertyEnergy } from '@/utilities/crmPropertyEnergy'
export { normalizeCRMPropertyEnergy } from '@/utilities/crmPropertyEnergy'
