import type { Block } from 'payload'

import { a } from '@/utilities/adminI18n'

export const PropertiesBlock: Block = {
  slug: 'propertiesBlock',
  interfaceName: 'PropertiesBlock',
  labels: {
    singular: a('admin.blocks.propertiesBlock.singular', 'Properties Block'),
    plural: a('admin.blocks.propertiesBlock.plural', 'Properties Blocks'),
  },
  fields: [
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      label: a('admin.blocks.propertiesBlock.subtitleLabel', 'Subtitle'),
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: a('admin.blocks.propertiesBlock.titleLabel', 'Title'),
    },
    {
      name: 'backgroundColor',
      type: 'select',
      label: a('admin.blocks.propertiesBlock.backgroundColorLabel', 'Background Color'),
      options: [
        {
          label: a('admin.blocks.propertiesBlock.backgroundSurface', 'Surface (White)'),
          value: 'surface',
        },
        {
          label: a(
            'admin.blocks.propertiesBlock.backgroundSurfaceContainerLow',
            'Surface Container Low (Light Grey)',
          ),
          value: 'surface-container-low',
        },
      ],
      defaultValue: 'surface',
    },
    {
      name: 'showSoldBadge',
      type: 'checkbox',
      label: a(
        'admin.blocks.propertiesBlock.showSoldBadgeLabel',
        'Show SOLD badge on all cards in this block',
      ),
      defaultValue: false,
    },
    {
      name: 'dataSource',
      type: 'select',
      label: a('admin.blocks.propertiesBlock.dataSourceLabel', 'Property Source'),
      defaultValue: 'cms',
      options: [
        {
          label: a('admin.blocks.propertiesBlock.dataSourceCms', 'Payload CMS (manual)'),
          value: 'cms',
        },
        {
          label: a('admin.blocks.propertiesBlock.dataSourceCrm', 'CRM API (dynamic)'),
          value: 'crm',
        },
      ],
    },
    {
      name: 'crmPreset',
      type: 'select',
      label: a('admin.blocks.propertiesBlock.crmPresetLabel', 'CRM Query Preset'),
      defaultValue: 'featured',
      options: [
        {
          label: a('admin.blocks.propertiesBlock.crmPresetFeatured', 'Featured Properties'),
          value: 'featured',
        },
        {
          label: a('admin.blocks.propertiesBlock.crmPresetBeachSide', 'Beach-Side Properties'),
          value: 'beachSide',
        },
        {
          label: a('admin.blocks.propertiesBlock.crmPresetGolf', 'Golf Properties'),
          value: 'golf',
        },
        {
          label: a('admin.blocks.propertiesBlock.crmPresetLuxury', 'Luxury Properties'),
          value: 'luxury',
        },
        {
          label: a('admin.blocks.propertiesBlock.crmPresetNewDevelopments', 'New Developments'),
          value: 'newDevelopments',
        },
        {
          label: a('admin.blocks.propertiesBlock.crmPresetNewListings', 'New Listings'),
          value: 'newListings',
        },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.dataSource === 'crm',
      },
    },
    {
      name: 'crmLimit',
      type: 'number',
      label: a('admin.blocks.propertiesBlock.crmLimitLabel', 'CRM Result Limit'),
      defaultValue: 5,
      min: 1,
      admin: {
        condition: (_, siblingData) => siblingData?.dataSource === 'crm',
      },
    },
    {
      name: 'properties',
      type: 'array',
      label: a('admin.blocks.propertiesBlock.propertiesLabel', 'Properties'),
      labels: {
        singular: a('admin.blocks.propertiesBlock.propertySingular', 'Property'),
        plural: a('admin.blocks.propertiesBlock.propertiesPlural', 'Properties'),
      },
      admin: {
        condition: (_, siblingData) => siblingData?.dataSource !== 'crm',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: a('admin.blocks.propertiesBlock.imageLabel', 'Image'),
        },
        {
          name: 'isNewListing',
          type: 'checkbox',
          defaultValue: false,
          label: a('admin.blocks.propertiesBlock.isNewListingLabel', 'New Listing'),
        },
        {
          name: 'location',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.propertiesBlock.locationLabel', 'Location'),
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: a('admin.blocks.propertiesBlock.propertyTitleLabel', 'Title'),
        },
        {
          name: 'beds',
          type: 'number',
          required: true,
          label: a('admin.blocks.propertiesBlock.bedsLabel', 'Beds'),
        },
        {
          name: 'baths',
          type: 'number',
          required: true,
          label: a('admin.blocks.propertiesBlock.bathsLabel', 'Baths'),
        },
        {
          name: 'sqft',
          type: 'number',
          required: true,
          label: a('admin.blocks.propertiesBlock.sqftLabel', 'Sqft'),
        },
        {
          name: 'price',
          type: 'text',
          required: true,
          label: a('admin.blocks.propertiesBlock.priceLabel', 'Price'),
        },
      ],
    },
  ],
}
