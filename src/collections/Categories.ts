import type { CollectionConfig } from 'payload'

import { a } from '@/utilities/adminI18n'
import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: a('admin.categories.singular', 'Category'),
    plural: a('admin.categories.plural', 'Categories'),
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: a('admin.categories.fields.title', 'Title'),
    },
    slugField({
      position: undefined,
      overrides: (field) => {
        for (const sub of field.fields) {
          if ('name' in sub && sub.name === 'slug') {
            sub.label = a('admin.categories.fields.slug', 'Slug')
          }
          if ('name' in sub && sub.name === 'generateSlug') {
            sub.label = a('admin.categories.fields.generateSlug', 'Generate slug')
          }
        }
        return field
      },
    }),
  ],
}
