import { headerFields } from '@/Header/fields'

import { discoverLocalizedFields } from './discoverFieldPaths'

const discovered = discoverLocalizedFields(headerFields)

export const HEADER_FIELD_REGISTRY = {
  strings: discovered.filter((field) => field.kind === 'string').map((field) => field.path),
  richText: discovered.filter((field) => field.kind === 'richtext').map((field) => field.path),
} as const
