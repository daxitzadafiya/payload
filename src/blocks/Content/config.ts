import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

const columnFields: Field[] = [
  {
    name: 'size',
    type: 'select',
    defaultValue: 'oneThird',
    label: a('admin.blocks.content.sizeLabel', 'Size'),
    options: [
      {
        label: a('admin.blocks.content.sizeOneThird', 'One Third'),
        value: 'oneThird',
      },
      {
        label: a('admin.blocks.content.sizeHalf', 'Half'),
        value: 'half',
      },
      {
        label: a('admin.blocks.content.sizeTwoThirds', 'Two Thirds'),
        value: 'twoThirds',
      },
      {
        label: a('admin.blocks.content.sizeFull', 'Full'),
        value: 'full',
      },
    ],
  },
  {
    name: 'richText',
    type: 'richText',
    localized: true,
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ]
      },
    }),
    label: false,
  },
  {
    name: 'enableLink',
    type: 'checkbox',
    label: a('admin.blocks.content.enableLinkLabel', 'Enable Link'),
  },
  link({
    overrides: {
      admin: {
        condition: (_data, siblingData) => {
          return Boolean(siblingData?.enableLink)
        },
      },
    },
  }),
]

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  labels: {
    singular: a('admin.blocks.content.singular', 'Content Block'),
    plural: a('admin.blocks.content.plural', 'Content Blocks'),
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: a('admin.blocks.content.columnsLabel', 'Columns'),
      labels: {
        singular: a('admin.blocks.content.columnSingular', 'Column'),
        plural: a('admin.blocks.content.columnsPlural', 'Columns'),
      },
      admin: {
        initCollapsed: true,
      },
      fields: columnFields,
    },
  ],
}
