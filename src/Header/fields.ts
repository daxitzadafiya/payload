import type { Field } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'
import { softDeleteItemFields } from '@/plugins/trashAndVersions/softDeleteFields'

export const headerFields: Field[] = [
  link({
    appearances: false,
    overrides: {
      name: 'favoritesLink',
      label: a('admin.header.favoritesLink', 'Favorites link'),
      admin: {
        description: a(
          'admin.header.favoritesLink.description',
          'Destination for the header heart icon. Link to your Favorites page (internal page reference or custom URL).',
        ),
      },
    },
  }),
  {
    name: 'navItems',
    type: 'array',
    localized: true,
    label: a('admin.header.navItems', 'Nav Items'),
    labels: {
      singular: a('admin.header.navItemSingular', 'Nav Item'),
      plural: a('admin.header.navItemsPlural', 'Nav Items'),
    },
    fields: [
      link({
        appearances: false,
      }),
      {
        name: 'subLinks',
        type: 'array',
        dbName: 'sub_nav',
        label: a('admin.header.navItems.subLinks', 'Sub Links'),
        labels: {
          singular: a('admin.header.navItems.subLinkSingular', 'Sub Link'),
          plural: a('admin.header.navItems.subLinksPlural', 'Sub Links'),
        },
        fields: [
          link({
            appearances: false,
            overrides: {
              dbName: 'sub_lnk',
            },
          }),
          ...softDeleteItemFields,
        ],
        admin: {
          description: a(
            'admin.header.navItems.subLinks.description',
            'Optional sub-links (e.g. For Sale, Sold). When added, this item renders as a dropdown — only the parent Label is shown in the header.',
          ),
          initCollapsed: true,
        },
      },
      ...softDeleteItemFields,
    ],
    admin: {
      description: a(
        'admin.header.navItems.description',
        'Navigation links for the current locale (switch locale in the admin bar to edit each language). Removing an item moves it to Globals Trash (soft delete).',
      ),
      initCollapsed: true,
      components: {
        RowLabel: '@/Header/RowLabel#RowLabel',
      },
    },
  },
]
