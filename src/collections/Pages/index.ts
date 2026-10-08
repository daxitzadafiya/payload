import type { CollectionConfig } from 'payload'

import { a } from '@/utilities/adminI18n'
import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { pageLayoutBlocks } from '@/blocks/pageLayoutBlocks'
import { hero } from '@/heros/config'
import { slugField } from 'payload'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { autoTranslatePageContent } from './hooks/autoTranslatePageContent'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  labels: {
    singular: a('admin.pages.singular', 'Page'),
    plural: a('admin.pages.plural', 'Pages'),
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: a('admin.pages.fields.title', 'Title'),
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [hero],
          label: a('admin.pages.tabs.hero', 'Hero'),
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              label: a('admin.pages.fields.layout', 'Layout'),
              blocks: [...pageLayoutBlocks],
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: a('admin.pages.tabs.content', 'Content'),
        },
        {
          name: 'meta',
          label: a('admin.pages.tabs.seo', 'SEO'),
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
              // if the generateUrl function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
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
      label: a('admin.pages.fields.publishedAt', 'Published At'),
      admin: {
        position: 'sidebar',
      },
    },
    slugField({
      overrides: (field) => {
        for (const sub of field.fields) {
          if ('name' in sub && sub.name === 'slug') {
            sub.label = a('admin.pages.fields.slug', 'Slug')
          }
          if ('name' in sub && sub.name === 'generateSlug') {
            sub.label = a('admin.pages.fields.generateSlug', 'Generate slug')
          }
        }
        return field
      },
    }),
  ],
  hooks: {
    afterChange: [autoTranslatePageContent, revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
