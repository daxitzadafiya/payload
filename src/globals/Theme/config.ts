import type { GlobalConfig } from 'payload'

import { a } from '@/utilities/adminI18n'

import { revalidateTheme } from './hooks/revalidateTheme'
import { THEME_CUSTOM_CSS_TEMPLATE } from './siteThemeTokens.mjs'
import {
  DEFAULT_THEME_GOOGLE_FONTS,
  normalizeGoogleFontsActive,
  THEME_FONT_MODE_OPTIONS,
  THEME_FONT_MODE_SITE_DEFAULT,
} from './googleFonts'

const themeFontModeOptions = THEME_FONT_MODE_OPTIONS.map((option) => ({
  ...option,
  label:
    option.value === 'site-default'
      ? a('admin.theme.fontMode.optionSiteDefault', option.label)
      : a('admin.theme.fontMode.optionGoogle', option.label),
}))

export const Theme: GlobalConfig = {
  slug: 'theme',
  label: a('admin.theme.label', 'Theme'),
  access: {
    read: () => true,
  },
  admin: {
    description: a(
      'admin.theme.description',
      'Site-wide CSS variables for Tailwind classes (bg-primary, text-tertiary, border-outline-variant, etc.). Also drives admin panel + auth page colors.',
    ),
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data
        if (data.googleFonts) {
          data.googleFonts = normalizeGoogleFontsActive(data.googleFonts)
        }
        return data
      },
    ],
    afterChange: [revalidateTheme],
  },
  fields: [
    {
      name: 'fontMode',
      type: 'select',
      label: a('admin.theme.fontMode', 'Font mode'),
      defaultValue: THEME_FONT_MODE_SITE_DEFAULT,
      options: [...themeFontModeOptions],
      admin: {
        description: a(
          'admin.theme.fontMode.description',
          'Site default keeps Outfit for body and EB Garamond for headlines. Custom mode applies one Google Font across the site.',
        ),
      },
    },
    {
      name: 'googleFonts',
      type: 'array',
      label: a('admin.theme.googleFonts', 'Google Fonts library'),
      labels: {
        singular: a('admin.theme.googleFonts.singular', 'Google Font'),
        plural: a('admin.theme.googleFonts.plural', 'Google Fonts'),
      },
      defaultValue: DEFAULT_THEME_GOOGLE_FONTS,
      admin: {
        condition: (_, siblingData) => siblingData?.fontMode === 'google',
        description: a(
          'admin.theme.googleFonts.description',
          'Add or remove any font by its exact Google Fonts family name (e.g. Figtree, Inter, Playfair Display). Mark exactly one row as Active — that font is applied site-wide.',
        ),
        initCollapsed: false,
        components: {
          RowLabel: '@/globals/Theme/GoogleFontRowLabel#GoogleFontRowLabel',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'family',
              type: 'text',
              label: a('admin.theme.googleFonts.family', 'Google Font family name'),
              required: true,
              admin: {
                width: '70%',
                placeholder: a('admin.theme.googleFonts.family.placeholder', 'Figtree'),
                description: a(
                  'admin.theme.googleFonts.family.description',
                  'Must match fonts.google.com exactly (case-sensitive).',
                ),
              },
            },
            {
              name: 'active',
              type: 'checkbox',
              label: a('admin.theme.googleFonts.active', 'Active'),
              defaultValue: false,
              admin: {
                width: '30%',
                style: { alignSelf: 'flex-end' },
                description: a(
                  'admin.theme.googleFonts.active.description',
                  'Only one font can be active at a time.',
                ),
                components: {
                  Field: '@/globals/Theme/ActiveFontCheckbox#ActiveFontCheckbox',
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'customCSS',
      type: 'code',
      label: a('admin.theme.customCSS', 'Custom CSS'),
      defaultValue: THEME_CUSTOM_CSS_TEMPLATE,
      admin: {
        language: 'css',
        description: a(
          'admin.theme.customCSS.description',
          'Defines :root variables used by Tailwind classes (e.g. --color-primary for bg-primary / text-primary). When empty, the default palette is used. These colors also theme the admin panel and auth pages.',
        ),
      },
    },
  ],
}
