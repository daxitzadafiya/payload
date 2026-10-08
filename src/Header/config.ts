import type { GlobalConfig } from 'payload'

import { a } from '@/utilities/adminI18n'
import { authenticated } from '@/access/authenticated'

import { headerFields } from './fields'
import { autoTranslateHeaderContent } from './hooks/autoTranslateHeaderContent'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  label: a('admin.header.label', 'Header'),
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    description: a(
      'admin.header.description',
      'Edit localized header copy in English; other locales update via DeepL on save when DeepL is enabled. Removed menu items go to Globals Trash; use Versions to compare and restore earlier Header states.',
    ),
  },
  fields: headerFields,
  hooks: {
    afterChange: [autoTranslateHeaderContent, revalidateHeader],
  },
}
