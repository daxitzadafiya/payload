import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { a, setAdminTranslationCache } from '@/utilities/adminI18n'
import { parseTranslationMap } from '@/collections/Translations/parseTranslationMap'

export const Translations: CollectionConfig = {
  slug: 'translations',
  labels: {
    singular: a('admin.translations.singular', 'Translation'),
    plural: a('admin.translations.plural', 'Translations'),
  },
  access: {
    create: () => false,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'key',
    defaultColumns: ['key', 'translations', 'updatedAt'],
    // Search key and JSON translation values (any locale text).
    listSearchableFields: ['key', 'translations'],
    description: a(
      'admin.translations.description',
      'UI strings created automatically by the app when t() runs (frontend) or admin.* keys for the admin panel. Edit translations here; do not add keys manually.',
    ),
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: a('admin.translations.fields.key', 'Key'),
      admin: {
        readOnly: true,
        description: a(
          'admin.translations.fields.keyDescription',
          'Set automatically by the app (e.g. propertyList.filters.search or admin.pages.title).',
        ),
      },
    },
    {
      name: 'translations',
      type: 'json',
      required: true,
      label: a('admin.translations.fields.translations', 'Translations'),
      admin: {
        description: a(
          'admin.translations.fields.translationsDescription',
          'One text field per language enabled in Globals → Localization. Add languages there to edit more locales here.',
        ),
        components: {
          Cell: '@/collections/Translations/TranslationsCell#TranslationsCell',
          Field: '@/collections/Translations/TranslationsField#TranslationsField',
        },
      },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc }) => {
        if (typeof doc.key === 'string' && doc.key.startsWith('admin.')) {
          setAdminTranslationCache(doc.key, parseTranslationMap(doc.translations))
        }
      },
    ],
  },
}
