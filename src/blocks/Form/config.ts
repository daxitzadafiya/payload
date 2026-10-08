import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { a } from '@/utilities/adminI18n'

export const FormBlock: Block = {
  slug: 'formBlock',
  interfaceName: 'FormBlock',
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      label: a('admin.blocks.formBlock.formLabel', 'Form'),
    },
    {
      name: 'enableIntro',
      type: 'checkbox',
      label: a('admin.blocks.formBlock.enableIntroLabel', 'Enable Intro Content'),
    },
    {
      name: 'introContent',
      type: 'richText',
      admin: {
        condition: (_, { enableIntro }) => Boolean(enableIntro),
      },
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
      label: a('admin.blocks.formBlock.introContentLabel', 'Intro Content'),
    },
  ],
  graphQL: {
    singularName: 'FormBlock',
  },
  labels: {
    plural: a('admin.blocks.formBlock.plural', 'Form Blocks'),
    singular: a('admin.blocks.formBlock.singular', 'Form Block'),
  },
}
