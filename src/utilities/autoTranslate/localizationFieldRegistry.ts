import type { Field } from 'payload'

import { discoverLocalizedFields } from './discoverFieldPaths'

/**
 * Only the Display name (`label`) inside Site languages is localized.
 * Keep this registry explicit so non-localized language rows stay shared.
 */
const localizationLanguageFields: Field[] = [
  {
    name: 'languages',
    type: 'array',
    fields: [
      {
        name: 'label',
        type: 'text',
        localized: true,
      },
    ],
  },
]

const discovered = discoverLocalizedFields(localizationLanguageFields)

export const LOCALIZATION_FIELD_REGISTRY = {
  strings: discovered.filter((field) => field.kind === 'string').map((field) => field.path),
  richText: discovered.filter((field) => field.kind === 'richtext').map((field) => field.path),
} as const
