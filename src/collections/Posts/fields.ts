import type { Field } from 'payload'

import { a } from '@/utilities/adminI18n'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

export const postFields: Field[] = [
  {
    name: 'title',
    type: 'text',
    required: true,
    localized: true,
    label: a('admin.posts.fields.title', 'Title'),
    admin: {
      description: a(
        'admin.posts.fields.enOnlyDeepLHint',
        'Edit in English only. Other languages refresh via DeepL when English changes on save.',
      ),
    },
  },
  {
    type: 'tabs',
    tabs: [
      {
        fields: [
          {
            name: 'subtitle',
            type: 'textarea',
            label: a('admin.posts.fields.subtitle', 'Subtitle'),
            localized: true,
            admin: {
              description: a(
                'admin.posts.fields.subtitleDescription',
                'Short summary shown on knowledge base cards. If empty, the SEO meta description is used instead. Edit in English only. Other languages refresh via DeepL when English changes on save.',
              ),
            },
          },
          {
            name: 'heroImage',
            type: 'upload',
            relationTo: 'media',
            label: a('admin.posts.fields.heroImage', 'Hero Image'),
          },
          {
            name: 'content',
            type: 'richText',
            localized: true,
            editor: lexicalEditor({
              features: ({ rootFeatures }) => {
                return [
                  ...rootFeatures,
                  HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
                  HorizontalRuleFeature(),
                ]
              },
            }),
            label: false,
            required: true,
            admin: {
              description: a(
                'admin.posts.fields.enOnlyDeepLHint',
                'Edit in English only. Other languages refresh via DeepL when English changes on save.',
              ),
            },
          },
        ],
        label: a('admin.posts.tabs.content', 'Content'),
      },
      {
        fields: [
          {
            name: 'relatedPosts',
            type: 'relationship',
            label: a('admin.posts.fields.relatedPosts', 'Related Posts'),
            admin: {
              position: 'sidebar',
            },
            filterOptions: ({ id }) => {
              return {
                id: {
                  not_in: [id],
                },
              }
            },
            hasMany: true,
            relationTo: 'posts',
          },
          {
            name: 'categories',
            type: 'relationship',
            label: a('admin.posts.fields.categories', 'Categories'),
            admin: {
              position: 'sidebar',
            },
            hasMany: true,
            relationTo: 'categories',
          },
        ],
        label: a('admin.posts.tabs.meta', 'Meta'),
      },
      {
        name: 'meta',
        label: a('admin.posts.tabs.seo', 'SEO'),
        fields: [
          OverviewField({
            titlePath: 'meta.title',
            descriptionPath: 'meta.description',
            imagePath: 'meta.image',
          }),
          MetaTitleField({
            hasGenerateFn: true,
          }),
          MetaImageField({
            relationTo: 'media',
          }),
          MetaDescriptionField({}),
          PreviewField({
            hasGenerateFn: true,
            titlePath: 'meta.title',
            descriptionPath: 'meta.description',
          }),
        ],
      },
    ],
  },
  {
    name: 'publishedAt',
    type: 'date',
    label: a('admin.posts.fields.publishedAt', 'Published At'),
    admin: {
      date: {
        pickerAppearance: 'dayAndTime',
      },
      position: 'sidebar',
    },
    hooks: {
      beforeChange: [
        ({ siblingData, value }) => {
          if (siblingData._status === 'published' && !value) {
            return new Date()
          }
          return value
        },
      ],
    },
  },
  {
    name: 'authors',
    type: 'relationship',
    label: a('admin.posts.fields.authors', 'Authors'),
    admin: {
      position: 'sidebar',
    },
    hasMany: true,
    relationTo: 'users',
  },
  {
    name: 'populatedAuthors',
    type: 'array',
    label: a('admin.posts.fields.populatedAuthors', 'Populated Authors'),
    access: {
      update: () => false,
    },
    admin: {
      disabled: true,
      readOnly: true,
    },
    fields: [
      {
        name: 'id',
        type: 'text',
        label: a('admin.posts.fields.populatedAuthorId', 'ID'),
      },
      {
        name: 'name',
        type: 'text',
        label: a('admin.posts.fields.populatedAuthorName', 'Name'),
      },
    ],
  },
  slugField({
    overrides: (field) => {
      for (const sub of field.fields) {
        if ('name' in sub && sub.name === 'slug') {
          sub.label = a('admin.posts.fields.slug', 'Slug')
        }
        if ('name' in sub && sub.name === 'generateSlug') {
          sub.label = a('admin.posts.fields.generateSlug', 'Generate slug')
        }
      }
      return field
    },
  }),
]
