import type { GlobalConfig } from 'payload'

import { a } from '@/utilities/adminI18n'

import { propertyFiltersFields } from './fields'
import { autoTranslatePropertyFiltersContent } from './hooks/autoTranslatePropertyFiltersContent'
import { revalidatePropertyFilters } from './hooks/revalidatePropertyFilters'

export const PropertyFilters: GlobalConfig = {
  slug: 'propertyFilters',
  label: a('admin.propertyFilters.label', 'Property Filters'),
  access: {
    read: () => true,
  },
  admin: {
    description: a(
      'admin.propertyFilters.description',
      'Dropdown options for property search filters and sort order. Edit labels in English; other locales update via DeepL on save when DeepL is enabled. Property type and location still come from the CRM API.',
    ),
  },
  hooks: {
    afterChange: [autoTranslatePropertyFiltersContent, revalidatePropertyFilters],
  },
  fields: propertyFiltersFields,
}
