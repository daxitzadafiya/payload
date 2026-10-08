import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { a } from '@/utilities/adminI18n'

export const Archive: Block = {
  slug: 'archive',
  interfaceName: 'ArchiveBlock',
  fields: [
    {
      name: 'introContent',
      type: 'richText',
      localized: true,
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
      label: a('admin.blocks.archive.introContentLabel', 'Intro Content'),
    },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'collection',
      label: a('admin.blocks.archive.populateByLabel', 'Populate By'),
      options: [
        {
          label: a('admin.blocks.archive.populateByCollection', 'Collection'),
          value: 'collection',
        },
        {
          label: a('admin.blocks.archive.populateBySelection', 'Individual Selection'),
          value: 'selection',
        },
      ],
    },
    {
      name: 'relationTo',
      type: 'select',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
      defaultValue: 'posts',
      label: a('admin.blocks.archive.relationToLabel', 'Collections To Show'),
      options: [
        {
          label: a('admin.blocks.archive.relationToPosts', 'Posts'),
          value: 'posts',
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
      hasMany: true,
      label: a('admin.blocks.archive.categoriesLabel', 'Categories To Show'),
      relationTo: 'categories',
    },
    {
      name: 'limit',
      type: 'number',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
        step: 1,
      },
      defaultValue: 10,
      label: a('admin.blocks.archive.limitLabel', 'Limit'),
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'selection',
      },
      hasMany: true,
      label: a('admin.blocks.archive.selectedDocsLabel', 'Selection'),
      relationTo: ['posts'],
    },
  ],
  labels: {
    plural: a('admin.blocks.archive.plural', 'Archives'),
    singular: a('admin.blocks.archive.singular', 'Archive'),
  },
}
