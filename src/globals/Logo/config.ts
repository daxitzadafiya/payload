import type { GlobalConfig } from 'payload'

import { a } from '@/utilities/adminI18n'

import { revalidateLogo } from './hooks/revalidateLogo'

export const SiteLogo: GlobalConfig = {
  slug: 'logo',
  label: a('admin.logo.label', 'Logo'),
  access: {
    read: () => true,
  },
  admin: {
    description: a(
      'admin.logo.description',
      'Site logos used in the header, footer, and admin panel.',
    ),
  },
  fields: [
    {
      name: 'appName',
      type: 'text',
      label: a('admin.logo.appName', 'App Name'),
      defaultValue: 'Horizon Estates',
      required: true,
      admin: {
        description: a(
          'admin.logo.appName.description',
          'Site name shown in page titles, metadata, and other branding.',
        ),
      },
    },
    {
      name: 'alt',
      type: 'text',
      label: a('admin.logo.alt', 'Alt'),
      defaultValue: 'Horizon Estates',
      required: true,
      admin: {
        description: a('admin.logo.alt.description', 'Alternative text for accessibility.'),
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'lightLogo',
          type: 'upload',
          relationTo: 'media',
          required: false,
          label: a('admin.logo.lightLogo', 'Light Logo'),
          admin: {
            width: '50%',
            description: a(
              'admin.logo.lightLogo.description',
              'Logo for light backgrounds (e.g. scrolled header). Prefer a wide transparent PNG (~1200×200). Size is auto-fitted in the header/footer.',
            ),
          },
        },
        {
          name: 'darkLogo',
          type: 'upload',
          relationTo: 'media',
          required: false,
          label: a('admin.logo.darkLogo', 'Dark Logo'),
          admin: {
            width: '50%',
            description: a(
              'admin.logo.darkLogo.description',
              'Logo for dark backgrounds (hero header, footer). Prefer a wide transparent PNG (~1200×200). Size is auto-fitted in the header/footer.',
            ),
          },
        },
      ],
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: a('admin.logo.favicon', 'Favicon'),
      admin: {
        description: a(
          'admin.logo.favicon.description',
          'Favicon used in browser tabs for both frontend and admin. Falls back to /favicon.ico.',
        ),
      },
    },
  ],
  hooks: {
    afterChange: [revalidateLogo],
  },
}
