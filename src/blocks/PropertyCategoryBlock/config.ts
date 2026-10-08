import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const PropertyCategoryBlock: Block = {
  slug: 'propertyCategoryBlock',
  dbName: 'prop_cat',
  interfaceName: 'PropertyCategoryBlock',
  labels: {
    singular: a('admin.blocks.propertyCategoryBlock.singular', 'Property Category Cards'),
    plural: a('admin.blocks.propertyCategoryBlock.plural', 'Property Category Card Sections'),
  },
  fields: [
    {
      name: 'cards',
      type: 'array',
      dbName: 'pc_cards',
      minRows: 1,
      labels: {
        singular: a('admin.blocks.propertyCategoryBlock.cardSingular', 'Card'),
        plural: a('admin.blocks.propertyCategoryBlock.cardsPlural', 'Cards'),
      },
      label: a('admin.blocks.propertyCategoryBlock.cardsLabel', 'Cards'),
      admin: {
        description: a(
          'admin.blocks.propertyCategoryBlock.cardsDescription',
          'Add 3 or more cards. Each card shows an image with title overlay; subtitle appears on hover.',
        ),
        initCollapsed: false,
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: a('admin.blocks.propertyCategoryBlock.imageLabel', 'Image'),
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.propertyCategoryBlock.titleLabel', 'Title'),
          admin: {
            description: a(
              'admin.blocks.propertyCategoryBlock.titleDescription',
              'Bold label on the card (e.g. New Listings, Luxury).',
            ),
            placeholder: a(
              'admin.blocks.propertyCategoryBlock.titlePlaceholder',
              'e.g. New Listings',
            ),
          },
        },
        {
          name: 'titleSuffix',
          type: 'text',
          localized: true,
          defaultValue: 'Properties',
          label: a('admin.blocks.propertyCategoryBlock.titleSuffixLabel', 'Title Suffix'),
          admin: {
            description: a(
              'admin.blocks.propertyCategoryBlock.titleSuffixDescription',
              'Lighter word after the title (e.g. Properties).',
            ),
          },
        },
        {
          name: 'subtitle',
          type: 'textarea',
          localized: true,
          label: a('admin.blocks.propertyCategoryBlock.subtitleLabel', 'Subtitle'),
          admin: {
            description: a(
              'admin.blocks.propertyCategoryBlock.subtitleDescription',
              'Shown under the title on hover (e.g. See here our latest additions…).',
            ),
          },
        },
        link({
          appearances: false,
          disableLabel: true,
          overrides: {
            name: 'cardLink',
            label: a('admin.blocks.propertyCategoryBlock.cardLinkLabel', 'Page Link'),
            admin: {
              description: a(
                'admin.blocks.propertyCategoryBlock.cardLinkDescription',
                'Select the page or URL this card should open.',
              ),
            },
          },
        }),
      ],
    },
  ],
}
