import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  labels: {
    singular: a('admin.blocks.mediaBlock.singular', 'Media Block'),
    plural: a('admin.blocks.mediaBlock.plural', 'Media Blocks'),
  },
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: a('admin.blocks.mediaBlock.media', 'Media'),
    },
  ],
}
