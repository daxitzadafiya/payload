import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const CertificatesBlock: Block = {
  slug: 'certificatesBlock',
  interfaceName: 'CertificatesBlock',
  labels: {
    singular: a('admin.blocks.certificatesBlock.singular', 'Certificates Section'),
    plural: a('admin.blocks.certificatesBlock.plural', 'Certificates Sections'),
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      label: a('admin.blocks.certificatesBlock.subtitleLabel', 'Subtitle'),
      admin: {
        description: a(
          'admin.blocks.certificatesBlock.subtitleDescription',
          'Small label above the section title.',
        ),
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: a('admin.blocks.certificatesBlock.titleLabel', 'Title'),
    },
    {
      name: 'certificates',
      type: 'array',
      required: true,
      minRows: 1,
      label: a('admin.blocks.certificatesBlock.certificatesLabel', 'Certificates'),
      labels: {
        singular: a('admin.blocks.certificatesBlock.certificateSingular', 'Certificate'),
        plural: a('admin.blocks.certificatesBlock.certificatesPlural', 'Certificates'),
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.certificatesBlock.certificateTitleLabel', 'Title'),
        },
        {
          name: 'subtitle',
          type: 'text',
          localized: true,
          label: a('admin.blocks.certificatesBlock.certificateSubtitleLabel', 'Subtitle'),
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: a('admin.blocks.certificatesBlock.certificateImageLabel', 'Image'),
        },
      ],
    },
  ],
}
