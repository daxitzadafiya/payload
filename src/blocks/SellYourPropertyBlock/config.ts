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

export const SellYourPropertyBlock: Block = {
  slug: 'sellYourPropertyBlock',
  dbName: 'sell_prop',
  interfaceName: 'SellYourPropertyBlock',
  labels: {
    singular: a('admin.blocks.sellYourPropertyBlock.singular', 'Sell Your Property'),
    plural: a('admin.blocks.sellYourPropertyBlock.plural', 'Sell Your Property'),
  },
  fields: [
    {
      name: 'focus',
      type: 'select',
      defaultValue: 'sell',
      label: a('admin.blocks.sellYourPropertyBlock.focusLabel', 'Focus'),
      options: [
        { label: a('admin.blocks.sellYourPropertyBlock.focusSell', 'Sell'), value: 'sell' },
        { label: a('admin.blocks.sellYourPropertyBlock.focusRent', 'Rent'), value: 'rent' },
      ],
      admin: {
        description: a(
          'admin.blocks.sellYourPropertyBlock.focusDescription',
          'Sidebar labels, and the owner-form intent. Sell submits as a sale. Rent submits as a rent. Page copy is edited in the fields below.',
        ),
      },
    },
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'Sell',
      label: a('admin.blocks.sellYourPropertyBlock.eyebrowLabel', 'Eyebrow'),
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'Sell your property with Zariko',
      label: a('admin.blocks.sellYourPropertyBlock.titleLabel', 'Title'),
    },
    {
      name: 'introHeading',
      type: 'text',
      localized: true,
      defaultValue: 'Thinking about selling?',
      label: a('admin.blocks.sellYourPropertyBlock.introHeadingLabel', 'Intro heading'),
    },
    {
      name: 'introLead',
      type: 'textarea',
      localized: true,
      defaultValue: "Let's talk — with us by your side, your home is as good as sold.",
      label: a('admin.blocks.sellYourPropertyBlock.introLeadLabel', 'Intro lead'),
    },
    richTextField(
      'highlight',
      'admin.blocks.sellYourPropertyBlock.highlightLabel',
      'Highlight statement',
    ),
    {
      name: 'offersHeading',
      type: 'text',
      localized: true,
      defaultValue: 'What we offer you:',
      label: a('admin.blocks.sellYourPropertyBlock.offersHeadingLabel', 'Offers heading'),
    },
    {
      name: 'offers',
      type: 'array',
      dbName: 'sell_off',
      minRows: 1,
      label: a('admin.blocks.sellYourPropertyBlock.offersLabel', 'Offers'),
      labels: {
        singular: a('admin.blocks.sellYourPropertyBlock.offerSingular', 'Offer'),
        plural: a('admin.blocks.sellYourPropertyBlock.offersPlural', 'Offers'),
      },
      admin: {
        initCollapsed: false,
        components: {
          RowLabel: '@/blocks/SellYourPropertyBlock/RowLabel#SellYourPropertyOfferRowLabel',
        },
      },
      fields: [
        {
          name: 'text',
          type: 'textarea',
          localized: true,
          required: true,
          label: a('admin.blocks.sellYourPropertyBlock.offerTextLabel', 'Offer text'),
        },
      ],
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      defaultValue: 'GET IN TOUCH!',
      label: a('admin.blocks.sellYourPropertyBlock.ctaLabelLabel', 'CTA button label'),
      admin: {
        description: a(
          'admin.blocks.sellYourPropertyBlock.ctaLabelDescription',
          'Shown on both buttons. Opens the owner form. Sell or Rent comes from Focus.',
        ),
      },
    },
    {
      name: 'whyHeading',
      type: 'text',
      localized: true,
      defaultValue: 'Why do others choose us?',
      label: a('admin.blocks.sellYourPropertyBlock.whyHeadingLabel', 'Why heading'),
    },
    {
      name: 'whyLead',
      type: 'text',
      localized: true,
      defaultValue: 'Our clients say it best:',
      label: a('admin.blocks.sellYourPropertyBlock.whyLeadLabel', 'Why lead'),
    },
    {
      name: 'quotes',
      type: 'array',
      dbName: 'sell_qt',
      minRows: 1,
      label: a('admin.blocks.sellYourPropertyBlock.quotesLabel', 'Client quotes'),
      labels: {
        singular: a('admin.blocks.sellYourPropertyBlock.quoteSingular', 'Quote'),
        plural: a('admin.blocks.sellYourPropertyBlock.quotesPlural', 'Quotes'),
      },
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/blocks/SellYourPropertyBlock/RowLabel#SellYourPropertyQuoteRowLabel',
        },
      },
      fields: [
        {
          name: 'text',
          type: 'textarea',
          localized: true,
          required: true,
          label: a('admin.blocks.sellYourPropertyBlock.quoteTextLabel', 'Quote text'),
        },
      ],
    },
    richTextField('closing', 'admin.blocks.sellYourPropertyBlock.closingLabel', 'Closing text'),
  ],
}
