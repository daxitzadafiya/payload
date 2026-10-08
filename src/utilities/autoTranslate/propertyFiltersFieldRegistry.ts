import { propertyFiltersFields } from '@/globals/PropertyFilters/fields'

import { discoverLocalizedFields } from './discoverFieldPaths'

const discovered = discoverLocalizedFields(propertyFiltersFields)

export const PROPERTY_FILTERS_FIELD_REGISTRY = {
  strings: discovered.filter((field) => field.kind === 'string').map((field) => field.path),
  richText: discovered.filter((field) => field.kind === 'richtext').map((field) => field.path),
} as const
