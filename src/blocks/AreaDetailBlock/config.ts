import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  OrderedListFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { a } from '@/utilities/adminI18n'

const richTextField = (name: string, labelKey: string, labelFallback: string): Field => ({
  name,
  type: 'richText',
  localized: true,
  label: a(labelKey, labelFallback),
  editor: lexicalEditor({
    features: ({ rootFeatures }) => [
      ...rootFeatures,
      HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
      UnorderedListFeature(),
      OrderedListFeature(),
      FixedToolbarFeature(),
      InlineToolbarFeature(),
    ],
  }),
})

export const AreaDetailBlock: Block = {
  slug: 'areaDetailBlock',
  dbName: 'area_dtl',
  interfaceName: 'AreaDetailBlock',
  labels: {
    singular: a('admin.blocks.areaDetailBlock.singular', 'Area Detail'),
    plural: a('admin.blocks.areaDetailBlock.plural', 'Area Detail'),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      label: a('admin.blocks.areaDetailBlock.titleLabel', 'Title'),
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      label: a('admin.blocks.areaDetailBlock.subtitleLabel', 'Subtitle'),
    },
    richTextField('body', 'admin.blocks.areaDetailBlock.bodyLabel', 'Body'),
    {
      name: 'closing',
      type: 'textarea',
      localized: true,
      label: a('admin.blocks.areaDetailBlock.closingLabel', 'Closing line'),
      admin: {
        description: a(
          'admin.blocks.areaDetailBlock.closingDescription',
          'Short summary sentence under the body text.',
        ),
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'mapLat',
          type: 'number',
          required: true,
          label: a('admin.blocks.areaDetailBlock.mapLatLabel', 'Map latitude'),
          admin: { width: '33%', step: 0.000001 },
        },
        {
          name: 'mapLng',
          type: 'number',
          required: true,
          label: a('admin.blocks.areaDetailBlock.mapLngLabel', 'Map longitude'),
          admin: { width: '33%', step: 0.000001 },
        },
        {
          name: 'mapZoom',
          type: 'number',
          defaultValue: 12,
          min: 1,
          max: 20,
          label: a('admin.blocks.areaDetailBlock.mapZoomLabel', 'Map zoom'),
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'aboutHeading',
      type: 'text',
      localized: true,
      label: a('admin.blocks.areaDetailBlock.aboutHeadingLabel', 'About heading'),
      admin: {
        description: a(
          'admin.blocks.areaDetailBlock.aboutHeadingDescription',
          'e.g. About Estepona:',
        ),
      },
    },
    {
      name: 'aboutStats',
      type: 'array',
      dbName: 'ad_stat',
      label: a('admin.blocks.areaDetailBlock.aboutStatsLabel', 'About stats'),
      labels: {
        singular: a('admin.blocks.areaDetailBlock.aboutStatSingular', 'Stat'),
        plural: a('admin.blocks.areaDetailBlock.aboutStatsPlural', 'Stats'),
      },
      admin: {
        components: {
          RowLabel: '@/blocks/AreaDetailBlock/RowLabel#AreaDetailStatRowLabel',
        },
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
          label: a('admin.blocks.areaDetailBlock.statLabelLabel', 'Label'),
        },
        {
          name: 'value',
          type: 'text',
          localized: true,
          required: true,
          label: a('admin.blocks.areaDetailBlock.statValueLabel', 'Value'),
        },
      ],
    },
    {
      name: 'distancesHeading',
      type: 'text',
      localized: true,
      label: a('admin.blocks.areaDetailBlock.distancesHeadingLabel', 'Distances heading'),
      admin: {
        description: a(
          'admin.blocks.areaDetailBlock.distancesHeadingDescription',
          'e.g. Distance from Estepona (km):',
        ),
      },
    },
    {
      name: 'distances',
      type: 'array',
      dbName: 'ad_dist',
      label: a('admin.blocks.areaDetailBlock.distancesLabel', 'Distances'),
      labels: {
        singular: a('admin.blocks.areaDetailBlock.distanceSingular', 'Distance'),
        plural: a('admin.blocks.areaDetailBlock.distancesPlural', 'Distances'),
      },
      admin: {
        components: {
          RowLabel: '@/blocks/AreaDetailBlock/RowLabel#AreaDetailDistanceRowLabel',
        },
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
          label: a('admin.blocks.areaDetailBlock.distanceLabelLabel', 'Label'),
        },
        {
          name: 'value',
          type: 'text',
          localized: true,
          required: true,
          label: a('admin.blocks.areaDetailBlock.distanceValueLabel', 'Value'),
        },
      ],
    },
  ],
}
