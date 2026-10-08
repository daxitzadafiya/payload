import type { Block } from 'payload'

import { emailTemplateEditor } from '@/fields/emailTemplateFields'
import { a } from '@/utilities/adminI18n'

export const AdvisorsBlock: Block = {
  slug: 'advisorsBlock',
  interfaceName: 'AdvisorsBlock',
  labels: {
    singular: a('admin.blocks.advisorsBlock.singular', 'Advisors'),
    plural: a('admin.blocks.advisorsBlock.plural', 'Advisors'),
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      defaultValue: 'MEET OUR TEAM',
      localized: true,
      label: a('admin.blocks.advisorsBlock.subtitleLabel', 'Subtitle'),
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Meet Our Distinguished Agents',
      localized: true,
      label: a('admin.blocks.advisorsBlock.titleLabel', 'Title'),
    },
    {
      name: 'advisors',
      type: 'array',
      minRows: 1,
      label: a('admin.blocks.advisorsBlock.advisorsLabel', 'Advisors'),
      labels: {
        singular: a('admin.blocks.advisorsBlock.advisorSingular', 'Advisor'),
        plural: a('admin.blocks.advisorsBlock.advisorsPlural', 'Advisors'),
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: a('admin.blocks.advisorsBlock.imageLabel', 'Image'),
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.advisorsBlock.nameLabel', 'Name'),
        },
        {
          name: 'role',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.advisorsBlock.roleLabel', 'Title / Role'),
          admin: {
            description: a(
              'admin.blocks.advisorsBlock.roleDescription',
              'e.g. Founder & Managing Director',
            ),
          },
        },
        {
          name: 'description',
          type: 'richText',
          localized: true,
          label: a('admin.blocks.advisorsBlock.descriptionLabel', 'Description'),
          editor: emailTemplateEditor,
          admin: {
            description: a(
              'admin.blocks.advisorsBlock.descriptionDescription',
              'Short biography shown below the title',
            ),
          },
        },
      ],
    },
  ],
}
