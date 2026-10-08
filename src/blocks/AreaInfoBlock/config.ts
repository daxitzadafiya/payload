import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const AreaInfoBlock: Block = {
  slug: 'areaInfoBlock',
  dbName: 'area_info',
  interfaceName: 'AreaInfoBlock',
  labels: {
    singular: a('admin.blocks.areaInfoBlock.singular', 'Area Info'),
    plural: a('admin.blocks.areaInfoBlock.plural', 'Area Info'),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'Areas',
      label: a('admin.blocks.areaInfoBlock.titleLabel', 'Title'),
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      defaultValue: 'Popular Residential Areas on the Costa del Sol',
      label: a('admin.blocks.areaInfoBlock.subtitleLabel', 'Subtitle'),
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      defaultValue:
        'The Costa del Sol is one of Europe’s most sought-after stretches of coastline — a landscape of mountains, marinas, golf, and year-round Mediterranean light. Discover the neighbourhoods our clients love most.',
      label: a('admin.blocks.areaInfoBlock.introLabel', 'Introduction'),
    },
    {
      name: 'highlights',
      type: 'array',
      dbName: 'ai_hlite',
      label: a('admin.blocks.areaInfoBlock.highlightsLabel', 'Area list'),
      labels: {
        singular: a('admin.blocks.areaInfoBlock.highlightSingular', 'Area'),
        plural: a('admin.blocks.areaInfoBlock.highlightsPlural', 'Areas'),
      },
      admin: {
        initCollapsed: false,
        description: a(
          'admin.blocks.areaInfoBlock.highlightsDescription',
          'Named highlights shown as a list above the photo cards.',
        ),
        components: {
          RowLabel: '@/blocks/AreaInfoBlock/RowLabel#AreaInfoHighlightRowLabel',
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          localized: true,
          required: true,
          label: a('admin.blocks.areaInfoBlock.highlightNameLabel', 'Area name'),
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          required: true,
          label: a('admin.blocks.areaInfoBlock.highlightDescriptionLabel', 'Description'),
        },
      ],
    },
    {
      name: 'cards',
      type: 'array',
      dbName: 'ai_card',
      label: a('admin.blocks.areaInfoBlock.cardsLabel', 'Area cards'),
      labels: {
        singular: a('admin.blocks.areaInfoBlock.cardSingular', 'Area card'),
        plural: a('admin.blocks.areaInfoBlock.cardsPlural', 'Area cards'),
      },
      admin: {
        initCollapsed: false,
        description: a(
          'admin.blocks.areaInfoBlock.cardsDescription',
          'Photo cards with a short description and a properties CTA. Pagination appears after two cards.',
        ),
        components: {
          RowLabel: '@/blocks/AreaInfoBlock/RowLabel#AreaInfoCardRowLabel',
        },
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: a('admin.blocks.areaInfoBlock.cardImageLabel', 'Image'),
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: true,
          label: a('admin.blocks.areaInfoBlock.cardTitleLabel', 'Title'),
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          label: a('admin.blocks.areaInfoBlock.cardDescriptionLabel', 'Short description'),
          admin: {
            description: a(
              'admin.blocks.areaInfoBlock.cardDescriptionDescription',
              'Short copy shown under the area title on the card.',
            ),
          },
        },
        {
          name: 'ctaLabel',
          type: 'text',
          localized: true,
          label: a('admin.blocks.areaInfoBlock.ctaLabelLabel', 'CTA button label'),
          admin: {
            description: a(
              'admin.blocks.areaInfoBlock.ctaLabelDescription',
              'e.g. VIEW PROPERTIES IN ESTEPONA',
            ),
          },
        },
        link({
          appearances: false,
          disableLabel: true,
          overrides: {
            name: 'ctaLink',
            label: a('admin.blocks.areaInfoBlock.ctaLinkLabel', 'CTA button link'),
            admin: {
              description: a(
                'admin.blocks.areaInfoBlock.ctaLinkDescription',
                'Link the CTA to an internal page or a custom URL.',
              ),
              condition: (_: unknown, siblingData: { ctaLabel?: string | null }) =>
                Boolean(siblingData?.ctaLabel?.trim()),
            },
          },
        }),
      ],
    },
  ],
}
