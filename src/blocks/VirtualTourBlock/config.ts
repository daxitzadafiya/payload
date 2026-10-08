import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const VirtualTourBlock: Block = {
  slug: 'virtualTourBlock',
  dbName: 'vtour',
  interfaceName: 'VirtualTourBlock',
  labels: {
    singular: a('admin.blocks.virtualTourBlock.singular', 'Virtual Tour CTA'),
    plural: a('admin.blocks.virtualTourBlock.plural', 'Virtual Tour CTAs'),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Step Inside Your Future Home from Anywhere in the World.',
      label: a('admin.blocks.virtualTourBlock.titleLabel', 'Title'),
    },
    {
      name: 'buttonText',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'EXPLORE NOW',
      label: a('admin.blocks.virtualTourBlock.buttonTextLabel', 'Button Text'),
    },
    link({
      appearances: false,
      overrides: {
        name: 'ctaLink',
        label: a('admin.blocks.virtualTourBlock.ctaLinkLabel', 'Button Link'),
      },
    }),
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: a('admin.blocks.virtualTourBlock.backgroundImageLabel', 'Background Image'),
    },
  ],
}
