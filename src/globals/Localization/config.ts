import type { GlobalConfig, Option } from 'payload'

import {
  cmsLocales,
  flagCountryOptions,
  localeCodes,
  type Locale,
} from '@/i18n/locales'
import { a, aString } from '@/utilities/adminI18n'

import {
  ensureLocalizedOptionLabel,
  flattenOptionLabelsForSave,
  pinRequestLocale,
} from '@/globals/PropertyFilters/hooks/ensureOptionLabels'

import { autoTranslateLocalizationContent } from './hooks/autoTranslateLocalizationContent'
import { revalidateLocalization } from './hooks/revalidateLocalization'
import { syncAdminLocaleOnDefaultChange } from './hooks/syncAdminLocaleOnDefaultChange'
import { syncContentOnLanguageChange } from './hooks/syncContentOnLanguageChange'

const contentLocaleOptions = cmsLocales.map(({ code, label }) => ({
  label: a(`admin.localization.contentLocale.${code}`, `${label} (${code})`),
  value: code,
}))

const flagOptions = flagCountryOptions.map(({ label, value }) => ({
  label: a(`admin.localization.flag.${value}`, label),
  value,
}))

function getSelectOptionValue(option: Option): string {
  if (typeof option === 'string') return option
  if ('value' in option && option.value != null) return String(option.value)
  return ''
}

export const Localization: GlobalConfig = {
  slug: 'localization',
  label: a('admin.localization.label', 'Localization'),
  access: {
    read: () => true,
  },
  admin: {
    description: a(
      'admin.localization.description',
      'Languages listed here appear on the website switcher, the admin “Locale” menu (content), and Account → Language (admin UI) when a Payload UI pack exists (en, de, es, fr, it, nl). Content locale must exist in src/i18n/locales.ts. Set the Default language for first-time visitors, add a row per language, then save. Display names are localized — edit them in the DeepL source language; DeepL fills other languages on save. When DeepL is enabled, newly added or re-enabled languages are auto-filled from the DeepL source language (Settings → DeepL) across Pages, Posts, Header, Footer, Display names, and other localized content (empty fields only).',
    ),
  },
  fields: [
    {
      name: 'syncAdminLocaleOnSave',
      type: 'ui',
      admin: {
        components: {
          Field: '@/globals/Localization/SyncAdminLocaleOnSave#SyncAdminLocaleOnSave',
        },
      },
    },
    {
      name: 'defaultLocale',
      type: 'select',
      label: a('admin.localization.defaultLocale', 'Default language'),
      required: true,
      defaultValue: 'en',
      options: contentLocaleOptions,
      filterOptions: ({ options, data }): Option[] => {
        const languages =
          (data as { languages?: { locale?: string; enabled?: boolean | null; label?: string }[] } | null)
            ?.languages ?? []

        const allowed = new Set(
          languages
            .filter((row) => row?.enabled !== false && row?.locale)
            .map((row) => String(row.locale)),
        )

        // Until Site languages are added, keep the full CMS pool so the field is usable.
        if (allowed.size === 0) return options

        return options.filter((option) => allowed.has(getSelectOptionValue(option)))
      },
      admin: {
        description: a(
          'admin.localization.defaultLocale.description',
          'Shown to first-time visitors (before they pick a language). Options come from Site languages below with “Show on site” enabled.',
        ),
      },
      validate: (value: string | null | undefined, { data, req }: { data: Record<string, unknown>; req?: { i18n?: { language?: string } } }) => {
        const lang = req?.i18n?.language
        if (!value || !localeCodes.includes(value as Locale)) {
          return aString(
            'admin.localization.validate.defaultLocaleInvalid',
            `Choose a valid locale code (${localeCodes.join(', ')}).`,
            lang,
          )
        }

        const languages = (data as { languages?: { locale?: string; enabled?: boolean | null }[] })
          ?.languages

        if (!Array.isArray(languages) || languages.length === 0) return true

        const match = languages.find((row) => row?.locale === value)
        if (!match) {
          return aString(
            'admin.localization.validate.defaultLocaleNotInSiteLanguages',
            'Default language must be one of the Site languages listed below.',
            lang,
          )
        }
        if (match.enabled === false) {
          return aString(
            'admin.localization.validate.defaultLocaleMustBeEnabled',
            'Default language must have “Show on site” enabled.',
            lang,
          )
        }
        return true
      },
    },
    {
      name: 'languages',
      type: 'array',
      label: a('admin.localization.languages', 'Site languages'),
      hooks: {
        beforeChange: [
          ({ value, req }) =>
            flattenOptionLabelsForSave(value, pinRequestLocale(req)),
        ],
      },
      admin: {
        description: a(
          'admin.localization.languages.description',
          'Add languages with + Add Language. Removing a language moves it to Globals Trash. Content locale must be a code from the list (not a display name like "Deutsch").',
        ),
        initCollapsed: false,
      },
      defaultValue: [
        {
          locale: 'en',
          label: 'En - UK',
          shortCode: 'EN',
          flag: 'gb',
          enabled: true,
        },
        {
          locale: 'de',
          label: 'Deutsch',
          shortCode: 'DE',
          flag: 'de',
          enabled: true,
        },
      ],
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: a('admin.localization.languages.enabled', 'Show on site'),
          defaultValue: true,
        },
        {
          name: 'locale',
          type: 'select',
          label: a('admin.localization.languages.locale', 'Content locale'),
          required: true,
          options: contentLocaleOptions,
          filterOptions: ({ options, data, siblingData }) => {
            const usedLocales =
              (data as { languages?: { locale?: string }[] } | undefined)?.languages
                ?.map((row) => row?.locale)
                .filter((code): code is string => Boolean(code)) ?? []

            return options.filter((option) => {
              const value = getSelectOptionValue(option)
              if (!value) return false
              if (value === siblingData?.locale) return true
              return !usedLocales.includes(value)
            })
          },
          admin: {
            description: a(
              'admin.localization.languages.locale.description',
              `CMS code (not the display name). Pool: ${localeCodes.join(', ')} — only codes you add in src/i18n/locales.ts.`,
            ),
          },
          validate: (value: string | null | undefined, { req }: { req?: { i18n?: { language?: string } } }) => {
            if (!value || !localeCodes.includes(value as Locale)) {
              return aString(
                'admin.localization.validate.localeInvalid',
                `Choose a valid locale code (${localeCodes.join(', ')}). Display names belong in "Display name", not here.`,
                req?.i18n?.language,
              )
            }
            return true
          },
        },
        {
          name: 'label',
          type: 'text',
          localized: true,
          label: a('admin.localization.languages.displayName', 'Display name'),
          required: true,
          hooks: {
            beforeChange: [ensureLocalizedOptionLabel],
          },
          admin: {
            description: a(
              'admin.localization.languages.displayName.description',
              'Header language menu label (e.g. English, Deutsch, Ελληνικά). Edit in English only; other languages refresh via DeepL when English changes on save.',
            ),
          },
        },
        {
          name: 'shortCode',
          type: 'text',
          label: a('admin.localization.languages.shortCode', 'Short code'),
          required: true,
          maxLength: 6,
          admin: {
            description: a(
              'admin.localization.languages.shortCode.description',
              'Header badge (e.g. EN, DE, EL)',
            ),
          },
        },
        {
          name: 'flag',
          type: 'select',
          label: a('admin.localization.languages.flag', 'Flag'),
          required: true,
          options: flagOptions,
        },
      ],
      validate: (rows, { req }: { req?: { i18n?: { language?: string } } }) => {
        if (!rows || !Array.isArray(rows)) return true

        const seen = new Set<string>()
        for (const row of rows) {
          const code = (row as { locale?: string | null })?.locale
          if (!code) continue
          if (seen.has(code)) {
            return aString(
              'admin.localization.validate.duplicateLocale',
              `Each language must use a different Content locale. Duplicate: ${code}`,
              req?.i18n?.language,
            )
          }
          seen.add(code)
        }
        return true
      },
    },
  ],
  hooks: {
    afterChange: [
      autoTranslateLocalizationContent,
      syncAdminLocaleOnDefaultChange,
      revalidateLocalization,
      syncContentOnLanguageChange,
    ],
    beforeChange: [
      ({ data }) => {
        const languages = data?.languages
        if (!Array.isArray(languages)) return data

        const normalizedLanguages = languages.map((row) => {
          if (!row?.locale) return row
          const code = String(row.locale)
          if (localeCodes.includes(code as Locale)) return row

          const byLabel = cmsLocales.find(
            (l) => l.label.toLowerCase() === code.toLowerCase(),
          )
          if (byLabel) {
            return { ...row, locale: byLabel.code }
          }

          return row
        })

        let defaultLocaleValue = data?.defaultLocale
        if (typeof defaultLocaleValue === 'string') {
          const enabledCodes = normalizedLanguages
            .filter((row) => row?.enabled !== false && row?.locale)
            .map((row) => String(row.locale))

          if (enabledCodes.length > 0 && !enabledCodes.includes(defaultLocaleValue)) {
            defaultLocaleValue = enabledCodes[0]
          }
        }

        return {
          ...data,
          defaultLocale: defaultLocaleValue,
          languages: normalizedLanguages,
        }
      },
    ],
  },
}
