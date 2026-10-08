import type { Field } from 'payload'

import { a } from '@/utilities/adminI18n'
import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'

export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'lowImpact',
      label: a('admin.heros.fields.type', 'Type'),
      options: [
        {
          label: a('admin.heros.type.none', 'None'),
          value: 'none',
        },
        {
          label: a('admin.heros.type.highImpact', 'High Impact'),
          value: 'highImpact',
        },
        {
          label: a('admin.heros.type.mediumImpact', 'Medium Impact'),
          value: 'mediumImpact',
        },
        {
          label: a('admin.heros.type.lowImpact', 'Low Impact'),
          value: 'lowImpact',
        },
      ],
      required: true,
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: false,
    },
    linkGroup({
      overrides: {
        maxRows: 2,
      },
    }),
    {
      name: 'media',
      type: 'upload',
      label: a('admin.heros.fields.media', 'Media'),
      admin: {
        condition: (_, { type } = {}) => ['highImpact', 'mediumImpact'].includes(type),
      },
      relationTo: 'media',
      required: true,
    },
  ],
  label: false,
}
