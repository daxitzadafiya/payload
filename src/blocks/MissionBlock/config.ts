import type { Block } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

export const MissionBlock: Block = {
  slug: 'missionBlock',
  interfaceName: 'MissionBlock',
  labels: {
    singular: a('admin.blocks.missionBlock.singular', 'Mission Block'),
    plural: a('admin.blocks.missionBlock.plural', 'Mission Blocks'),
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      label: a('admin.blocks.missionBlock.subtitleLabel', 'Subtitle'),
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: a('admin.blocks.missionBlock.titleLabel', 'Title'),
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      localized: true,
      label: a('admin.blocks.missionBlock.contentLabel', 'Content'),
    },
    {
      name: 'buttonText',
      type: 'text',
      localized: true,
      label: a('admin.blocks.missionBlock.buttonTextLabel', 'Button Text'),
      admin: {
        description: a(
          'admin.blocks.missionBlock.buttonTextDescription',
          'Text displayed on the call-to-action button',
        ),
      },
    },
    link({
      appearances: false,
      disableLabel: true,
      overrides: {
        name: 'ctaLink',
        label: a('admin.blocks.missionBlock.ctaLinkLabel', 'Button Link'),
        admin: {
          description: a(
            'admin.blocks.missionBlock.ctaLinkDescription',
            'Where the button navigates. Only used when Button Text is set.',
          ),
          condition: (_: unknown, siblingData: { buttonText?: string | null }) =>
            Boolean(siblingData?.buttonText?.trim()),
        },
      },
    }),
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: a('admin.blocks.missionBlock.imageLabel', 'Primary Image'),
      admin: {
        description: a(
          'admin.blocks.missionBlock.imageDescription',
          'Main collage photograph (largest).',
        ),
      },
    },
    {
      name: 'collageImage2',
      type: 'upload',
      relationTo: 'media',
      label: a('admin.blocks.missionBlock.collageImage2Label', 'Collage Image 2'),
      admin: {
        description: a(
          'admin.blocks.missionBlock.collageImage2Description',
          'Overlapping portrait or team photo. Optional.',
        ),
      },
    },
    {
      name: 'collageImage3',
      type: 'upload',
      relationTo: 'media',
      label: a('admin.blocks.missionBlock.collageImage3Label', 'Collage Image 3'),
      admin: {
        description: a(
          'admin.blocks.missionBlock.collageImage3Description',
          'Smaller overlapping interior photo. Optional.',
        ),
      },
    },
  ],
}
