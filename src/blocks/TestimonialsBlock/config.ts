import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const TestimonialsBlock: Block = {
  slug: 'testimonialsBlock',
  interfaceName: 'TestimonialsBlock',
  labels: {
    singular: a('admin.blocks.testimonialsBlock.singular', 'Testimonials'),
    plural: a('admin.blocks.testimonialsBlock.plural', 'Testimonials'),
  },
  fields: [
    {
      name: 'testimonials',
      type: 'array',
      minRows: 1,
      label: a('admin.blocks.testimonialsBlock.testimonialsLabel', 'Testimonials'),
      labels: {
        singular: a('admin.blocks.testimonialsBlock.testimonialSingular', 'Testimonial'),
        plural: a('admin.blocks.testimonialsBlock.testimonialsPlural', 'Testimonials'),
      },
      fields: [
        {
          name: 'quote',
          type: 'textarea',
          required: true,
          localized: true,
          label: a('admin.blocks.testimonialsBlock.quoteLabel', 'Quote'),
        },
        {
          name: 'authorName',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.testimonialsBlock.authorNameLabel', 'Author Name'),
        },
        {
          name: 'authorRole',
          type: 'text',
          label: a('admin.blocks.testimonialsBlock.authorRoleLabel', 'Author Role'),
          admin: {
            description: a(
              'admin.blocks.testimonialsBlock.authorRoleDescription',
              'Optional title or location',
            ),
          },
        },
      ],
    },
  ],
}
