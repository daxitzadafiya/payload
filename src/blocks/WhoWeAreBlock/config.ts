import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const WhoWeAreBlock: Block = {
  slug: 'whoWeAreBlock',
  interfaceName: 'WhoWeAreBlock',
  labels: {
    singular: a('admin.blocks.whoWeAreBlock.singular', 'Who We Are'),
    plural: a('admin.blocks.whoWeAreBlock.plural', 'Who We Are Sections'),
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      defaultValue: 'WHO WE ARE',
      label: a('admin.blocks.whoWeAreBlock.subtitleLabel', 'Subtitle'),
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.subtitleDescription',
          'Small uppercase label displayed above the title',
        ),
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: a('admin.blocks.whoWeAreBlock.titleLabel', 'Title'),
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.titleDescription',
          'Main seriffed heading of the section',
        ),
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      label: a('admin.blocks.whoWeAreBlock.descriptionLabel', 'Description'),
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.descriptionDescription',
          'Main narrative text explaining who you are',
        ),
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: a('admin.blocks.whoWeAreBlock.imageLabel', 'Primary Image'),
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.imageDescription',
          'Main collage photograph (largest).',
        ),
      },
    },
    {
      name: 'collageImage2',
      type: 'upload',
      relationTo: 'media',
      label: a('admin.blocks.whoWeAreBlock.collageImage2Label', 'Collage Image 2'),
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.collageImage2Description',
          'Overlapping portrait or team photo. Optional.',
        ),
      },
    },
    {
      name: 'collageImage3',
      type: 'upload',
      relationTo: 'media',
      label: a('admin.blocks.whoWeAreBlock.collageImage3Label', 'Collage Image 3'),
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.collageImage3Description',
          'Smaller overlapping interior photo. Optional.',
        ),
      },
    },
    {
      name: 'buttonText',
      type: 'text',
      localized: true,
      label: a('admin.blocks.whoWeAreBlock.buttonTextLabel', 'Button Text'),
      admin: {
        description: a(
          'admin.blocks.whoWeAreBlock.buttonTextDescription',
          'Text displayed on the call-to-action button',
        ),
      },
    },
    link({
      appearances: false,
      disableLabel: true,
      overrides: {
        name: 'ctaLink',
        label: a('admin.blocks.whoWeAreBlock.ctaLinkLabel', 'Call to Action'),
        admin: {
          description: a(
            'admin.blocks.whoWeAreBlock.ctaLinkDescription',
            'Where the button navigates. Only used when Button Text is set.',
          ),
          condition: (_: unknown, siblingData: { buttonText?: string | null }) =>
            Boolean(siblingData?.buttonText?.trim()),
        },
      },
    }),
  ],
}
