import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { a } from '@/utilities/adminI18n'

export const Banner: Block = {
  slug: 'banner',
  labels: {
    singular: a('admin.blocks.banner.singular', 'Banner'),
    plural: a('admin.blocks.banner.plural', 'Banners'),
  },
  fields: [
    {
      name: 'style',
      type: 'select',
      defaultValue: 'info',
      label: a('admin.blocks.banner.styleLabel', 'Style'),
      options: [
        { label: a('admin.blocks.banner.styleInfo', 'Info'), value: 'info' },
        { label: a('admin.blocks.banner.styleWarning', 'Warning'), value: 'warning' },
        { label: a('admin.blocks.banner.styleError', 'Error'), value: 'error' },
        { label: a('admin.blocks.banner.styleSuccess', 'Success'), value: 'success' },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
      label: false,
      required: true,
    },
  ],
  interfaceName: 'BannerBlock',
}
