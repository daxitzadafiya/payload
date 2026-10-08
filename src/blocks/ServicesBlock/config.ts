import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const ServicesBlock: Block = {
  slug: 'servicesBlock',
  dbName: 'services',
  interfaceName: 'ServicesBlock',
  labels: {
    singular: a('admin.blocks.servicesBlock.singular', 'Services Section'),
    plural: a('admin.blocks.servicesBlock.plural', 'Services Sections'),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: a('admin.blocks.servicesBlock.titleLabel', 'Title'),
      admin: {
        description: a(
          'admin.blocks.servicesBlock.titleDescription',
          'Main centered heading (e.g. Zariko is your real estate broker and your advisor).',
        ),
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      label: a('admin.blocks.servicesBlock.descriptionLabel', 'Description'),
      admin: {
        description: a(
          'admin.blocks.servicesBlock.descriptionDescription',
          'Supporting paragraph under the main title.',
        ),
      },
    },
    {
      name: 'items',
      type: 'array',
      dbName: 'svc_items',
      minRows: 1,
      maxRows: 6,
      label: a('admin.blocks.servicesBlock.itemsLabel', 'Service Items'),
      labels: {
        singular: a('admin.blocks.servicesBlock.itemSingular', 'Item'),
        plural: a('admin.blocks.servicesBlock.itemsPlural', 'Items'),
      },
      admin: {
        description: a(
          'admin.blocks.servicesBlock.itemsDescription',
          'Typically 3 columns. Each item has an icon, title, description, and CTA button.',
        ),
      },
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          defaultValue: 'key',
          label: a('admin.blocks.servicesBlock.iconLabel', 'Icon'),
          options: [
            { label: a('admin.blocks.servicesBlock.iconKey', 'Key'), value: 'key' },
            { label: a('admin.blocks.servicesBlock.iconMap', 'Map'), value: 'map' },
            { label: a('admin.blocks.servicesBlock.iconHome', 'Home'), value: 'home' },
            { label: a('admin.blocks.servicesBlock.iconUsers', 'Users'), value: 'users' },
            { label: a('admin.blocks.servicesBlock.iconHandshake', 'Handshake'), value: 'handshake' },
            { label: a('admin.blocks.servicesBlock.iconAward', 'Award'), value: 'award' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.servicesBlock.itemTitleLabel', 'Title'),
          admin: {
            placeholder: a(
              'admin.blocks.servicesBlock.itemTitlePlaceholder',
              'e.g. Dedicated Local Team',
            ),
          },
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          localized: true,
          label: a('admin.blocks.servicesBlock.itemDescriptionLabel', 'Description'),
        },
        {
          name: 'buttonText',
          type: 'text',
          localized: true,
          defaultValue: 'More Info',
          label: a('admin.blocks.servicesBlock.buttonTextLabel', 'Button Text'),
        },
        link({
          appearances: false,
          disableLabel: true,
          overrides: {
            name: 'buttonLink',
            label: a('admin.blocks.servicesBlock.buttonLinkLabel', 'Button Link'),
            admin: {
              description: a(
                'admin.blocks.servicesBlock.buttonLinkDescription',
                'Page or URL the button opens.',
              ),
              condition: (_: unknown, siblingData: { buttonText?: string | null }) =>
                Boolean(siblingData?.buttonText?.trim()),
            },
          },
        }),
      ],
    },
  ],
}
