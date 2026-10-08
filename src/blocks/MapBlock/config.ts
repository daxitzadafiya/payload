import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const MapBlock: Block = {
  slug: 'mapBlock',
  interfaceName: 'MapBlock',
  labels: {
    singular: a('admin.blocks.mapBlock.singular', 'Map'),
    plural: a('admin.blocks.mapBlock.plural', 'Maps'),
  },
  fields: [
    {
      name: 'center',
      type: 'group',
      label: a('admin.blocks.mapBlock.centerLabel', 'Default map center'),
      fields: [
        {
          name: 'lat',
          type: 'number',
          label: a('admin.blocks.mapBlock.latLabel', 'Latitude'),
          defaultValue: 48.9903224,
          required: true,
          admin: {
            step: 0.000001,
          },
        },
        {
          name: 'lng',
          type: 'number',
          label: a('admin.blocks.mapBlock.lngLabel', 'Longitude'),
          defaultValue: 12.1991392,
          required: true,
          admin: {
            step: 0.000001,
          },
        },
      ],
    },
    {
      name: 'defaultZoom',
      type: 'number',
      label: a('admin.blocks.mapBlock.defaultZoomLabel', 'Default zoom'),
      defaultValue: 6,
      min: 1,
      max: 20,
      admin: {
        description: a(
          'admin.blocks.mapBlock.defaultZoomDescription',
          'Initial zoom level when the map loads.',
        ),
      },
    },
    {
      name: 'height',
      type: 'number',
      defaultValue: 500,
      label: a('admin.blocks.mapBlock.heightLabel', 'Height'),
      admin: {
        description: a('admin.blocks.mapBlock.heightDescription', 'Map height in pixels.'),
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      defaultValue: 'Map',
      label: a('admin.blocks.mapBlock.titleLabel', 'Title'),
      admin: {
        description: a('admin.blocks.mapBlock.titleDescription', 'Accessible title for the map.'),
      },
    },
  ],
}
