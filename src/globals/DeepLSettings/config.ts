import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { getSiteContentLocales } from '@/i18n/getSiteContentLocales'
import { cmsLocales, type Locale } from '@/i18n/locales'
import { a } from '@/utilities/adminI18n'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

const sourceLanguageOptions = cmsLocales.map(({ code, label }) => ({
  label: a(`admin.localization.contentLocale.${code}`, `${label} (${code})`),
  value: code,
}))

export const DeepLSettings: GlobalConfig = {
  slug: 'deeplSettings',
  label: a('admin.deeplSettings.label', 'DeepL'),
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description: a(
      'admin.deeplSettings.description',
      'DeepL API credentials for auto-translating missing UI strings via t() (frontend and admin.* keys). Stored in the database — not in environment variables.',
    ),
    group: a('admin.groups.settings', 'Settings'),
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      label: a('admin.deeplSettings.enabled', 'Enable DeepL auto-translation'),
    },
    {
      name: 'sourceLanguage',
      type: 'select',
      defaultValue: 'en',
      options: sourceLanguageOptions,
      label: a('admin.deeplSettings.sourceLanguage', 'Source language'),
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description: a(
          'admin.deeplSettings.sourceLanguage.description',
          'Content saved in this language is sent to DeepL to fill the other site languages. Options match Site languages in Globals → Localization. Switch the admin Locale to this language before editing translatable fields.',
        ),
        components: {
          Field: '@/globals/DeepLSettings/SourceLanguageField#DeepLSourceLanguageField',
        },
      },
    },
    {
      name: 'apiUrl',
      type: 'text',
      defaultValue: 'https://api.deepl.com',
      label: a('admin.deeplSettings.apiUrl', 'API URL'),
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description: a(
          'admin.deeplSettings.apiUrl.description',
          'Use https://api-free.deepl.com for free-tier accounts.',
        ),
      },
    },
    {
      name: 'apiKey',
      type: 'text',
      label: a('admin.deeplSettings.apiKey', 'API key'),
      required: true,
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (!data) return data
        const locales = await getSiteContentLocales(req.payload)
        const current =
          typeof data.sourceLanguage === 'string' ? data.sourceLanguage.trim().toLowerCase() : ''
        if (!locales.includes(current as Locale)) {
          data.sourceLanguage = locales[0] ?? 'en'
        }
        return data
      },
    ],
    afterChange: [
      async () => {
        await revalidateCacheTag('global_deeplSettings')
      },
    ],
  },
}
