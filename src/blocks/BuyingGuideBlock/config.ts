import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  OrderedListFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { a } from '@/utilities/adminI18n'

const richTextField = (name: string, labelKey: string, labelFallback: string): Field => ({
  name,
  type: 'richText',
  localized: true,
  label: a(labelKey, labelFallback),
  editor: lexicalEditor({
    features: ({ rootFeatures }) => [
      ...rootFeatures,
      HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
      UnorderedListFeature(),
      OrderedListFeature(),
      FixedToolbarFeature(),
      InlineToolbarFeature(),
    ],
  }),
})

export const BuyingGuideBlock: Block = {
  slug: 'buyingGuideBlock',
  dbName: 'buy_guide',
  interfaceName: 'BuyingGuideBlock',
  labels: {
    singular: a('admin.blocks.buyingGuideBlock.singular', 'Buying Guide'),
    plural: a('admin.blocks.buyingGuideBlock.plural', 'Buying Guides'),
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'Help & advice',
      label: a('admin.blocks.buyingGuideBlock.eyebrowLabel', 'Eyebrow'),
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'Buying guide in Spain: Zariko Plan',
      label: a('admin.blocks.buyingGuideBlock.titleLabel', 'Title'),
    },
    {
      name: 'lead',
      type: 'textarea',
      localized: true,
      defaultValue:
        'A clear path from first conversation to keys in hand — budget, locations, process, taxes, and more.',
      label: a('admin.blocks.buyingGuideBlock.leadLabel', 'Lead / subtitle'),
    },
    {
      name: 'steps',
      type: 'array',
      dbName: 'bg_steps',
      minRows: 1,
      label: a('admin.blocks.buyingGuideBlock.stepsLabel', 'Timeline steps'),
      labels: {
        singular: a('admin.blocks.buyingGuideBlock.stepSingular', 'Step'),
        plural: a('admin.blocks.buyingGuideBlock.stepsPlural', 'Steps'),
      },
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/blocks/BuyingGuideBlock/RowLabel#BuyingGuideRowLabel',
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: true,
          label: a('admin.blocks.buyingGuideBlock.stepTitleLabel', 'Step title'),
        },
        richTextField('body', 'admin.blocks.buyingGuideBlock.stepBodyLabel', 'Step content'),
      ],
    },
    {
      name: 'closingHeading',
      type: 'text',
      localized: true,
      defaultValue: 'Successful buying in Spain — request our free comprehensive guide',
      label: a('admin.blocks.buyingGuideBlock.closingHeadingLabel', 'Closing heading'),
    },
    richTextField('closingBody', 'admin.blocks.buyingGuideBlock.closingBodyLabel', 'Closing content'),
  ],
}
