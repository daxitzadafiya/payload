import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const OurTestimonialsBlock: Block = {
  slug: 'ourTestimonialsBlock',
  dbName: 'our_tmnl',
  interfaceName: 'OurTestimonialsBlock',
  labels: {
    singular: a('admin.blocks.ourTestimonialsBlock.singular', 'Our Testimonials'),
    plural: a('admin.blocks.ourTestimonialsBlock.plural', 'Our Testimonials'),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      defaultValue: 'What our clients say',
      label: a('admin.blocks.ourTestimonialsBlock.titleLabel', 'Title'),
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      defaultValue:
        'At Zariko we are proud of the feedback we receive from our clients. It reflects the dedication, transparency and personal service we put into every step of the buying and selling journey.',
      label: a('admin.blocks.ourTestimonialsBlock.introLabel', 'Introduction'),
      admin: {
        description: a(
          'admin.blocks.ourTestimonialsBlock.introDescription',
          'Short paragraph shown under the page title.',
        ),
      },
    },
    {
      name: 'testimonials',
      type: 'array',
      dbName: 'ot_item',
      minRows: 1,
      label: a('admin.blocks.ourTestimonialsBlock.testimonialsLabel', 'Testimonials'),
      labels: {
        singular: a('admin.blocks.ourTestimonialsBlock.testimonialSingular', 'Testimonial'),
        plural: a('admin.blocks.ourTestimonialsBlock.testimonialsPlural', 'Testimonials'),
      },
      admin: {
        initCollapsed: false,
        components: {
          RowLabel: '@/blocks/OurTestimonialsBlock/RowLabel#OurTestimonialsRowLabel',
        },
      },
      fields: [
        {
          name: 'quote',
          type: 'textarea',
          localized: true,
          required: true,
          label: a('admin.blocks.ourTestimonialsBlock.quoteLabel', 'Quote'),
        },
        {
          name: 'attribution',
          type: 'text',
          localized: true,
          required: true,
          label: a('admin.blocks.ourTestimonialsBlock.attributionLabel', 'Attribution'),
          admin: {
            description: a(
              'admin.blocks.ourTestimonialsBlock.attributionDescription',
              'Client name and origin, e.g. “Emma & Elias from Belgium”.',
            ),
          },
        },
      ],
    },
  ],
}
