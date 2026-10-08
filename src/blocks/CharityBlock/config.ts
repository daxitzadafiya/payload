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

export const CharityBlock: Block = {
  slug: 'charityBlock',
  dbName: 'charity',
  interfaceName: 'CharityBlock',
  labels: {
    singular: a('admin.blocks.charityBlock.singular', 'Charity'),
    plural: a('admin.blocks.charityBlock.plural', 'Charity'),
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      defaultValue: 'About us',
      label: a('admin.blocks.charityBlock.eyebrowLabel', 'Eyebrow'),
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'Charity',
      label: a('admin.blocks.charityBlock.titleLabel', 'Title'),
    },
    {
      name: 'subtitle',
      type: 'textarea',
      localized: true,
      defaultValue: 'Together for a Better World — Zariko & Triple A Marbella',
      label: a('admin.blocks.charityBlock.subtitleLabel', 'Subtitle'),
    },
    richTextField('body', 'admin.blocks.charityBlock.bodyLabel', 'Body content'),
    {
      name: 'videoUrl',
      type: 'text',
      label: a('admin.blocks.charityBlock.videoUrlLabel', 'Video URL'),
      admin: {
        description: a(
          'admin.blocks.charityBlock.videoUrlDescription',
          'YouTube or Vimeo URL to embed below the body text.',
        ),
      },
    },
    {
      name: 'videoCaption',
      type: 'text',
      localized: true,
      defaultValue: 'Refugio Triple A Marbella',
      label: a('admin.blocks.charityBlock.videoCaptionLabel', 'Video caption'),
    },
  ],
}
