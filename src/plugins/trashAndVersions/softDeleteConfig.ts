import type { SoftDeletableItem } from './softDeleteArrayItems'

export type SoftDeleteFieldSpec = {
  /** Top-level array field name on the global document */
  field: string
  /** Nested array field names (e.g. header nav sub-links) */
  nested?: string[]
  /** Admin label shown in Globals Trash */
  fieldLabel: string
  /** Whether the array itself is localized (per admin locale) */
  localized?: boolean
  /**
   * Array rows contain localized subfields (e.g. label).
   * Soft-delete/restore must use locale: 'all' so labels are not wiped.
   */
  hasLocalizedFields?: boolean
  labelFrom: (item: SoftDeletableItem) => string
}

function linkLabel(item: SoftDeletableItem): string {
  const link = item.link as { label?: string | null } | undefined
  return link?.label || String(item.id || 'Item')
}

function localizedOptionLabel(item: SoftDeletableItem, fallback: string): string {
  const label = item.label
  if (typeof label === 'string' && label.trim()) return label
  if (label && typeof label === 'object') {
    const record = label as Record<string, unknown>
    const preferred =
      record.en || Object.values(record).find((value) => typeof value === 'string' && value.trim())
    if (typeof preferred === 'string' && preferred.trim()) return preferred
  }
  return String(item.value || item.id || fallback)
}

/** Array fields that soft-delete into Globals Trash instead of hard-deleting. */
export const GLOBAL_SOFT_DELETE_FIELDS: Record<string, SoftDeleteFieldSpec[]> = {
  header: [
    {
      field: 'navItems',
      nested: ['subLinks'],
      fieldLabel: 'Nav item',
      localized: true,
      labelFrom: linkLabel,
    },
  ],
  footer: [
    {
      field: 'navItems',
      fieldLabel: 'Nav item',
      localized: true,
      labelFrom: linkLabel,
    },
    {
      field: 'socialLinks',
      fieldLabel: 'Social link',
      labelFrom: (item) => String(item.icon || item.id || 'Social link'),
    },
    {
      field: 'certifications',
      fieldLabel: 'Certification',
      labelFrom: (item) => String(item.label || item.id || 'Certification'),
    },
    {
      field: 'legalLinks',
      fieldLabel: 'Legal link',
      localized: true,
      labelFrom: linkLabel,
    },
  ],
  localization: [
    {
      field: 'languages',
      fieldLabel: 'Language',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Language'),
    },
  ],
  propertyFilters: [
    {
      field: 'sortOptions',
      fieldLabel: 'Sort option',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Sort option'),
    },
    {
      field: 'priceRanges',
      fieldLabel: 'Price range',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Price range'),
    },
    {
      field: 'bedrooms',
      fieldLabel: 'Bedrooms option',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Bedrooms'),
    },
    {
      field: 'bathrooms',
      fieldLabel: 'Bathrooms option',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Bathrooms'),
    },
    {
      field: 'features',
      fieldLabel: 'Feature',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Feature'),
    },
    {
      field: 'deliveryDates',
      fieldLabel: 'Delivery date',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Delivery date'),
    },
    {
      field: 'distanceToSea',
      fieldLabel: 'Distance to sea',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Distance to sea'),
    },
    {
      field: 'guests',
      fieldLabel: 'Guests option',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Guests'),
    },
    {
      field: 'holidayBudgetRanges',
      fieldLabel: 'Holiday budget',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Budget range'),
    },
    {
      field: 'minPrices',
      fieldLabel: 'Min price',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Min price'),
    },
    {
      field: 'maxPrices',
      fieldLabel: 'Max price',
      hasLocalizedFields: true,
      labelFrom: (item) => localizedOptionLabel(item, 'Max price'),
    },
  ],
  theme: [
    {
      field: 'googleFonts',
      fieldLabel: 'Google Font',
      labelFrom: (item) => String(item.family || item.id || 'Font'),
    },
  ],
}

export function getSoftDeleteSpecsForGlobal(slug: string): SoftDeleteFieldSpec[] {
  return GLOBAL_SOFT_DELETE_FIELDS[slug] || []
}
