import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const InteractiveMapBlock: Block = {
  slug: 'interactiveMapBlock',
  interfaceName: 'InteractiveMapBlock',
  labels: {
    singular: a('admin.blocks.interactiveMapBlock.singular', 'Interactive Map'),
    plural: a('admin.blocks.interactiveMapBlock.plural', 'Interactive Maps'),
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      label: a('admin.blocks.interactiveMapBlock.subtitleLabel', 'Subtitle'),
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: a('admin.blocks.interactiveMapBlock.titleLabel', 'Title'),
    },
    {
      name: 'locations',
      type: 'array',
      label: a('admin.blocks.interactiveMapBlock.locationsLabel', 'Locations'),
      labels: {
        singular: a('admin.blocks.interactiveMapBlock.locationSingular', 'Location'),
        plural: a('admin.blocks.interactiveMapBlock.locationsPlural', 'Locations'),
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.interactiveMapBlock.locationLabelLabel', 'Label'),
        },
      ],
    },
    {
      name: 'offices',
      type: 'array',
      label: a('admin.blocks.interactiveMapBlock.officesLabel', 'Offices'),
      labels: {
        singular: a('admin.blocks.interactiveMapBlock.officeSingular', 'Office'),
        plural: a('admin.blocks.interactiveMapBlock.officesPlural', 'Offices'),
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.interactiveMapBlock.officeNameLabel', 'Name'),
        },
        {
          name: 'address',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.interactiveMapBlock.officeAddressLabel', 'Address'),
        },
      ],
    },
    {
      name: 'mapImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: a('admin.blocks.interactiveMapBlock.mapImageLabel', 'Map Image'),
    },
    {
      name: 'pins',
      type: 'array',
      label: a('admin.blocks.interactiveMapBlock.pinsLabel', 'Pins'),
      labels: {
        singular: a('admin.blocks.interactiveMapBlock.pinSingular', 'Pin'),
        plural: a('admin.blocks.interactiveMapBlock.pinsPlural', 'Pins'),
      },
      fields: [
        {
          name: 'topPercentage',
          type: 'number',
          required: true,
          label: a('admin.blocks.interactiveMapBlock.topPercentageLabel', 'Top Percentage'),
          admin: {
            description: a(
              'admin.blocks.interactiveMapBlock.topPercentageDescription',
              'Y position percentage (0-100)',
            ),
          },
        },
        {
          name: 'leftPercentage',
          type: 'number',
          required: true,
          label: a('admin.blocks.interactiveMapBlock.leftPercentageLabel', 'Left Percentage'),
          admin: {
            description: a(
              'admin.blocks.interactiveMapBlock.leftPercentageDescription',
              'X position percentage (0-100)',
            ),
          },
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          label: a('admin.blocks.interactiveMapBlock.pinTitleLabel', 'Title'),
        },
        {
          name: 'subtitle',
          type: 'text',
          localized: true,
          label: a('admin.blocks.interactiveMapBlock.pinSubtitleLabel', 'Subtitle'),
        },
        {
          name: 'isPulsing',
          type: 'checkbox',
          defaultValue: false,
          label: a('admin.blocks.interactiveMapBlock.isPulsingLabel', 'Pulsing'),
        },
      ],
    },
  ],
}
