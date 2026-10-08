import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const KnowledgeBaseBlock: Block = {
  slug: 'knowledgeBaseBlock',
  dbName: 'kb',
  interfaceName: 'KnowledgeBaseBlock',
  labels: {
    singular: a('admin.blocks.knowledgeBaseBlock.singular', 'Knowledge Base'),
    plural: a('admin.blocks.knowledgeBaseBlock.plural', 'Knowledge Base'),
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      defaultValue: 'KNOWLEDGE BASE',
      localized: true,
      label: a('admin.blocks.knowledgeBaseBlock.subtitleLabel', 'Subtitle'),
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Latest News',
      localized: true,
      label: a('admin.blocks.knowledgeBaseBlock.titleLabel', 'Title'),
    },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'collection',
      label: a('admin.blocks.knowledgeBaseBlock.populateByLabel', 'Populate By'),
      options: [
        {
          label: a('admin.blocks.knowledgeBaseBlock.populateByCollection', 'Latest from Posts'),
          value: 'collection',
        },
        {
          label: a('admin.blocks.knowledgeBaseBlock.populateBySelection', 'Select Posts'),
          value: 'selection',
        },
        {
          label: a('admin.blocks.knowledgeBaseBlock.populateByManual', 'Manual entries'),
          value: 'manual',
        },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 12,
      label: a('admin.blocks.knowledgeBaseBlock.limitLabel', 'Limit'),
      admin: {
        condition: (_, siblingData) => siblingData?.populateBy === 'collection',
      },
    },
    {
      name: 'selectedPosts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      label: a('admin.blocks.knowledgeBaseBlock.selectedPostsLabel', 'Selected Posts'),
      admin: {
        condition: (_, siblingData) => siblingData?.populateBy === 'selection',
      },
    },
    {
      name: 'articles',
      type: 'array',
      dbName: 'arts',
      label: a('admin.blocks.knowledgeBaseBlock.articlesLabel', 'Articles'),
      labels: {
        singular: a('admin.blocks.knowledgeBaseBlock.articleSingular', 'Article'),
        plural: a('admin.blocks.knowledgeBaseBlock.articlesPlural', 'Articles'),
      },
      admin: {
        condition: (_, siblingData) => siblingData?.populateBy === 'manual',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: a('admin.blocks.knowledgeBaseBlock.articleImageLabel', 'Image'),
        },
        {
          name: 'category',
          type: 'text',
          required: true,
          label: a('admin.blocks.knowledgeBaseBlock.articleCategoryLabel', 'Category'),
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.knowledgeBaseBlock.articleTitleLabel', 'Title'),
        },
        {
          name: 'subtitle',
          type: 'textarea',
          localized: true,
          label: a('admin.blocks.knowledgeBaseBlock.articleSubtitleLabel', 'Subtitle'),
        },
        {
          name: 'excerpt',
          type: 'textarea',
          localized: true,
          label: a('admin.blocks.knowledgeBaseBlock.articleExcerptLabel', 'Excerpt'),
        },
        {
          name: 'publishedAt',
          type: 'date',
          label: a('admin.blocks.knowledgeBaseBlock.articlePublishedAtLabel', 'Published At'),
          admin: {
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: a('admin.blocks.knowledgeBaseBlock.articleUrlLabel', 'Article URL'),
          admin: {
            description: a(
              'admin.blocks.knowledgeBaseBlock.articleUrlDescription',
              'Path (e.g. /posts/my-article) or full URL',
            ),
          },
        },
        {
          name: 'newTab',
          type: 'checkbox',
          label: a('admin.blocks.knowledgeBaseBlock.newTabLabel', 'Open in new tab'),
          defaultValue: false,
        },
      ],
    },
    link({
      appearances: false,
      overrides: {
        name: 'viewAllLink',
        label: a('admin.blocks.knowledgeBaseBlock.viewAllLinkLabel', 'View All Button'),
        dbName: 'va_lnk',
        admin: {
          description: a(
            'admin.blocks.knowledgeBaseBlock.viewAllLinkDescription',
            'Centered button below the cards. Defaults to /posts when not set.',
          ),
        },
      },
    }),
  ],
}
