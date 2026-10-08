import type { Block, Field } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

const panelFields: Field[] = [
  {
    name: 'title',
    type: 'text',
    required: true,
    localized: true,
    label: a('admin.blocks.dualActionBlock.titleLabel', 'Title'),
  },
  {
    name: 'description',
    type: 'textarea',
    required: true,
    localized: true,
    label: a('admin.blocks.dualActionBlock.descriptionLabel', 'Description'),
  },
  {
    name: 'buttonText',
    type: 'text',
    required: true,
    localized: true,
    label: a('admin.blocks.dualActionBlock.buttonTextLabel', 'Button Text'),
  },
  link({
    appearances: false,
    overrides: {
      name: 'panelLink',
      label: a('admin.blocks.dualActionBlock.panelLinkLabel', 'Button Link'),
    },
  }),
]

export const DualActionBlock: Block = {
  slug: 'dualActionBlock',
  dbName: 'dual',
  interfaceName: 'DualActionBlock',
  labels: {
    singular: a('admin.blocks.dualActionBlock.singular', 'Dual Action CTA'),
    plural: a('admin.blocks.dualActionBlock.plural', 'Dual Action CTAs'),
  },
  fields: [
    {
      name: 'assignPanel',
      type: 'group',
      label: a('admin.blocks.dualActionBlock.assignPanelLabel', 'Assign Your Property (left)'),
      fields: panelFields,
    },
    {
      name: 'searchPanel',
      type: 'group',
      label: a('admin.blocks.dualActionBlock.searchPanelLabel', 'Request a Search (right)'),
      fields: panelFields,
    },
  ],
}
