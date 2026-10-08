import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const InfoCardsBlock: Block = {
  slug: 'infoCardsBlock',
  dbName: 'info_cards',
  interfaceName: 'InfoCardsBlock',
  labels: {
    singular: a('admin.blocks.infoCardsBlock.singular', 'Info Cards'),
    plural: a('admin.blocks.infoCardsBlock.plural', 'Info Card Sections'),
  },
  fields: [
    {
      name: 'cards',
      type: 'array',
      dbName: 'info_items',
      minRows: 1,
      maxRows: 6,
      label: a('admin.blocks.infoCardsBlock.cardsLabel', 'Cards'),
      labels: {
        singular: a('admin.blocks.infoCardsBlock.cardSingular', 'Card'),
        plural: a('admin.blocks.infoCardsBlock.cardsPlural', 'Cards'),
      },
      admin: {
        description: a(
          'admin.blocks.infoCardsBlock.cardsDescription',
          'Typically 3 cards (e.g. Testimonials, Charity, Area info). Each card has an image, title, description, and button.',
        ),
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: a('admin.blocks.infoCardsBlock.imageLabel', 'Image'),
          admin: {
            description: a(
              'admin.blocks.infoCardsBlock.imageDescription',
              'Shown in a circle above the title. Prefer a square photo or graphic so the crop looks balanced.',
            ),
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.infoCardsBlock.titleLabel', 'Title'),
          admin: {
            placeholder: a(
              'admin.blocks.infoCardsBlock.titlePlaceholder',
              'e.g. Testimonials',
            ),
          },
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          localized: true,
          label: a('admin.blocks.infoCardsBlock.descriptionLabel', 'Description'),
        },
        {
          name: 'buttonText',
          type: 'text',
          localized: true,
          defaultValue: 'View More',
          label: a('admin.blocks.infoCardsBlock.buttonTextLabel', 'Button Text'),
        },
        link({
          appearances: false,
          disableLabel: true,
          overrides: {
            name: 'buttonLink',
            label: a('admin.blocks.infoCardsBlock.buttonLinkLabel', 'Button Link'),
            admin: {
              description: a(
                'admin.blocks.infoCardsBlock.buttonLinkDescription',
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
