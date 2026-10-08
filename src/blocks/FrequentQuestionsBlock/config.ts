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

export const FrequentQuestionsBlock: Block = {
  slug: 'frequentQuestionsBlock',
  dbName: 'faq',
  interfaceName: 'FrequentQuestionsBlock',
  labels: {
    singular: a('admin.blocks.frequentQuestionsBlock.singular', 'Frequent Questions'),
    plural: a('admin.blocks.frequentQuestionsBlock.plural', 'Frequent Questions'),
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'Buying guide',
      label: a('admin.blocks.frequentQuestionsBlock.eyebrowLabel', 'Eyebrow'),
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'Frequent questions',
      label: a('admin.blocks.frequentQuestionsBlock.titleLabel', 'Title'),
    },
    {
      name: 'lead',
      type: 'textarea',
      localized: true,
      defaultValue: 'You are in a position to realise your dream of having a place in the sun...',
      label: a('admin.blocks.frequentQuestionsBlock.leadLabel', 'Lead / subtitle'),
      admin: {
        description: a(
          'admin.blocks.frequentQuestionsBlock.leadDescription',
          'Short gold-accented line under the title.',
        ),
      },
    },
    {
      name: 'introHeading',
      type: 'text',
      localized: true,
      defaultValue: 'Buying a Property in Spain: Frequently Asked Questions',
      label: a('admin.blocks.frequentQuestionsBlock.introHeadingLabel', 'Intro heading'),
    },
    richTextField('intro', 'admin.blocks.frequentQuestionsBlock.introLabel', 'Intro content'),
    {
      name: 'items',
      type: 'array',
      dbName: 'faq_items',
      minRows: 1,
      label: a('admin.blocks.frequentQuestionsBlock.itemsLabel', 'Questions'),
      labels: {
        singular: a('admin.blocks.frequentQuestionsBlock.itemSingular', 'Question'),
        plural: a('admin.blocks.frequentQuestionsBlock.itemsPlural', 'Questions'),
      },
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/blocks/FrequentQuestionsBlock/RowLabel#FrequentQuestionsRowLabel',
        },
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          localized: true,
          required: true,
          label: a('admin.blocks.frequentQuestionsBlock.questionLabel', 'Question'),
        },
        richTextField('answer', 'admin.blocks.frequentQuestionsBlock.answerLabel', 'Answer'),
      ],
    },
  ],
}
