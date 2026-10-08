import { footerFields } from '@/Footer/fields'

import { discoverLocalizedFields } from './discoverFieldPaths'

const discovered = discoverLocalizedFields(footerFields)

export const FOOTER_FIELD_REGISTRY = {
  strings: discovered.filter((field) => field.kind === 'string').map((field) => field.path),
  richText: discovered.filter((field) => field.kind === 'richtext').map((field) => field.path),
} as const
