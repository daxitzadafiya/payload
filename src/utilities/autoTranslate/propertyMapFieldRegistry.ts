import { propertyMapFields } from '@/globals/PropertyMap/fields'

import { discoverLocalizedFields } from './discoverFieldPaths'

const discovered = discoverLocalizedFields(propertyMapFields)

export const PROPERTY_MAP_FIELD_REGISTRY = {
  strings: discovered.filter((field) => field.kind === 'string').map((field) => field.path),
  richText: discovered.filter((field) => field.kind === 'richtext').map((field) => field.path),
} as const
