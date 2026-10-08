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

export const AfterSalesCareBlock: Block = {
  slug: 'afterSalesCareBlock',
  dbName: 'ascare',
  interfaceName: 'AfterSalesCareBlock',
  labels: {
    singular: a('admin.blocks.afterSalesCareBlock.singular', 'After Sales Care'),
    plural: a('admin.blocks.afterSalesCareBlock.plural', 'After Sales Care'),
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'Help & Advice',
      label: a('admin.blocks.afterSalesCareBlock.eyebrowLabel', 'Eyebrow'),
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'After Sales Care by Zariko',
      label: a('admin.blocks.afterSalesCareBlock.titleLabel', 'Title'),
    },
    {
      name: 'lead',
      type: 'textarea',
      localized: true,
      defaultValue: 'After your purchase you can also count on Zariko!',
      label: a('admin.blocks.afterSalesCareBlock.leadLabel', 'Lead / subtitle'),
      admin: {
        description: a(
          'admin.blocks.afterSalesCareBlock.leadDescription',
          'Gold-accented line under the title in the masthead.',
        ),
      },
    },
    {
      name: 'sectionHeading',
      type: 'text',
      localized: true,
      defaultValue: 'After Sales by Zariko',
      label: a('admin.blocks.afterSalesCareBlock.sectionHeadingLabel', 'Section heading'),
    },
    richTextField('intro', 'admin.blocks.afterSalesCareBlock.introLabel', 'Intro content'),
    {
      name: 'servicesHeading',
      type: 'text',
      localized: true,
      defaultValue: 'Our after sales services include:',
      label: a('admin.blocks.afterSalesCareBlock.servicesHeadingLabel', 'Services heading'),
    },
    {
      name: 'services',
      type: 'array',
      dbName: 'asc_svc',
      minRows: 1,
      label: a('admin.blocks.afterSalesCareBlock.servicesLabel', 'Services'),
      labels: {
        singular: a('admin.blocks.afterSalesCareBlock.serviceSingular', 'Service'),
        plural: a('admin.blocks.afterSalesCareBlock.servicesPlural', 'Services'),
      },
      admin: {
        initCollapsed: false,
        components: {
          RowLabel: '@/blocks/AfterSalesCareBlock/RowLabel#AfterSalesCareRowLabel',
        },
      },
      fields: [
        {
          name: 'text',
          type: 'textarea',
          localized: true,
          required: true,
          label: a('admin.blocks.afterSalesCareBlock.serviceTextLabel', 'Service text'),
        },
      ],
    },
  ],
}
