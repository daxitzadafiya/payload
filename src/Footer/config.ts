import type { GlobalConfig } from 'payload'

import { a } from '@/utilities/adminI18n'
import { authenticated } from '@/access/authenticated'

import { footerFields } from './fields'
import { autoTranslateFooterContent } from './hooks/autoTranslateFooterContent'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: a('admin.footer.label', 'Footer'),
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    description: a(
      'admin.footer.description',
      'Edit localized footer copy in English; other locales update via DeepL on save when DeepL is enabled. Removed links and icons go to Globals Trash; use Versions to compare and restore earlier Footer states.',
    ),
  },
  fields: footerFields,
  hooks: {
    afterChange: [autoTranslateFooterContent, revalidateFooter],
  },
}
