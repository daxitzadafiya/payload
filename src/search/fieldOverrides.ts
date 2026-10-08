import type { Field } from 'payload'

import { a } from '@/utilities/adminI18n'

export const searchFields: Field[] = [
  {
    name: 'slug',
    type: 'text',
    index: true,
    label: a('admin.search.fields.slug', 'Slug'),
    admin: {
      readOnly: true,
    },
  },
  {
    name: 'meta',
    label: a('admin.search.fields.meta', 'Meta'),
    type: 'group',
    index: true,
    admin: {
      readOnly: true,
    },
    fields: [
      {
        type: 'text',
        name: 'title',
        label: a('admin.search.fields.metaTitle', 'Title'),
      },
      {
        type: 'text',
        name: 'description',
        label: a('admin.search.fields.metaDescription', 'Description'),
      },
      {
        name: 'image',
        label: a('admin.search.fields.metaImage', 'Image'),
        type: 'upload',
        relationTo: 'media',
      },
    ],
  },
  {
    label: a('admin.search.fields.categories', 'Categories'),
    labels: {
      singular: a('admin.search.fields.categorySingular', 'Category'),
      plural: a('admin.search.fields.categoriesPlural', 'Categories'),
    },
    name: 'categories',
    type: 'array',
    admin: {
      readOnly: true,
    },
    fields: [
      {
        name: 'relationTo',
        type: 'text',
        label: a('admin.search.fields.relationTo', 'Relation To'),
      },
      {
        name: 'categoryID',
        type: 'text',
        label: a('admin.search.fields.categoryID', 'Category ID'),
      },
      {
        name: 'title',
        type: 'text',
        label: a('admin.search.fields.categoryTitle', 'Title'),
      },
    ],
  },
]
