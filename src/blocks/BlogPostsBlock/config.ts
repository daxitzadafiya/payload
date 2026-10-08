import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const BlogPostsBlock: Block = {
  slug: 'blogPostsBlock',
  dbName: 'blog',
  interfaceName: 'BlogPostsBlock',
  labels: {
    singular: a('admin.blocks.blogPostsBlock.singular', 'Blog Posts'),
    plural: a('admin.blocks.blogPostsBlock.plural', 'Blog Posts'),
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      label: a('admin.blocks.blogPostsBlock.subtitleLabel', 'Subtitle'),
      admin: {
        description: a(
          'admin.blocks.blogPostsBlock.subtitleDescription',
          'Optional label above the heading.',
        ),
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Blog',
      localized: true,
      label: a('admin.blocks.blogPostsBlock.titleLabel', 'Title'),
    },
    {
      name: 'postsPerPage',
      type: 'number',
      defaultValue: 9,
      min: 1,
      max: 24,
      label: a('admin.blocks.blogPostsBlock.postsPerPageLabel', 'Posts Per Page'),
    },
    {
      type: 'collapsible',
      label: a('admin.blocks.blogPostsBlock.emptyStateLabel', 'Empty State'),
      admin: {
        initCollapsed: true,
        description: a(
          'admin.blocks.blogPostsBlock.emptyStateDescription',
          'Shown when there are no published posts to display.',
        ),
      },
      fields: [
        {
          name: 'emptyStateEyebrow',
          type: 'text',
          label: a('admin.blocks.blogPostsBlock.emptyStateEyebrowLabel', 'Eyebrow'),
          defaultValue: 'No Results',
          localized: true,
        },
        {
          name: 'emptyStateTitle',
          type: 'text',
          label: a('admin.blocks.blogPostsBlock.emptyStateTitleLabel', 'Title'),
          defaultValue: 'No posts found',
          localized: true,
        },
        {
          name: 'emptyStateDescription',
          type: 'textarea',
          label: a('admin.blocks.blogPostsBlock.emptyStateDescriptionLabel', 'Description'),
          defaultValue: 'There are no articles published yet. Please check back soon for new content.',
          localized: true,
        },
        link({
          appearances: false,
          overrides: {
            name: 'emptyStateLink',
            label: a('admin.blocks.blogPostsBlock.emptyStateLinkLabel', 'Call to Action (optional)'),
            dbName: 'es_lnk',
            admin: {
              description: a(
                'admin.blocks.blogPostsBlock.emptyStateLinkDescription',
                'Optional button below the empty state message.',
              ),
            },
          },
        }),
      ],
    },
  ],
}
