import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const StatsBlock: Block = {
  slug: 'statsBlock',
  interfaceName: 'StatsBlock',
  labels: {
    singular: a('admin.blocks.statsBlock.singular', 'Stats Block'),
    plural: a('admin.blocks.statsBlock.plural', 'Stats Blocks'),
  },
  fields: [
    {
      name: 'stats',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      label: a('admin.blocks.statsBlock.statsLabel', 'Stats'),
      labels: {
        singular: a('admin.blocks.statsBlock.statSingular', 'Stat'),
        plural: a('admin.blocks.statsBlock.statsPlural', 'Stats'),
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          label: a('admin.blocks.statsBlock.valueLabel', 'Value'),
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.statsBlock.labelLabel', 'Label'),
          admin: {
            description: a(
              'admin.blocks.statsBlock.labelDescription',
              'Edit in English only. Other languages refresh via DeepL when English changes on save.',
            ),
          },
        },
      ],
    },
  ],
}
