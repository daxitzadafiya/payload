import type { Field } from 'payload'

import { SITE_THEME_TOKEN_DEFAULTS } from '@/globals/Theme/siteThemeTokens.mjs'
import { a } from '@/utilities/adminI18n'

export const propertyMapFields: Field[] = [
  {
    name: 'modalTitle',
    type: 'text',
    label: a('admin.propertyMap.modalTitle', 'Modal title'),
    defaultValue: 'Property Map',
    localized: true,
  },
  {
    name: 'defaultCenter',
    type: 'group',
    label: a('admin.propertyMap.defaultCenter', 'Default map center'),
    fields: [
      {
        name: 'lat',
        type: 'number',
        label: a('admin.propertyMap.defaultCenter.lat', 'Latitude'),
        defaultValue: 38.3452,
        required: true,
      },
      {
        name: 'lng',
        type: 'number',
        label: a('admin.propertyMap.defaultCenter.lng', 'Longitude'),
        defaultValue: -0.481,
        required: true,
      },
    ],
  },
  {
    name: 'defaultZoom',
    type: 'number',
    label: a('admin.propertyMap.defaultZoom', 'Default zoom'),
    defaultValue: 8,
    min: 1,
    max: 20,
    required: true,
  },
  {
    name: 'minZoom',
    type: 'number',
    label: a('admin.propertyMap.minZoom', 'Minimum zoom'),
    defaultValue: 5,
    min: 1,
    max: 20,
  },
  {
    name: 'maxZoom',
    type: 'number',
    label: a('admin.propertyMap.maxZoom', 'Maximum zoom'),
    defaultValue: 18,
    min: 1,
    max: 20,
  },
  {
    name: 'enableDrawSearch',
    type: 'checkbox',
    label: a('admin.propertyMap.enableDrawSearch', 'Enable draw-to-search'),
    defaultValue: true,
  },
  {
    name: 'drawInstructionText',
    type: 'text',
    label: a('admin.propertyMap.drawInstructionText', 'Draw instruction text'),
    defaultValue: 'Draw A Shape Around The Region(S) You Would Like To Search',
    localized: true,
    admin: {
      condition: (_, siblingData) => siblingData?.enableDrawSearch !== false,
    },
  },
  {
    name: 'drawButtonLabel',
    type: 'text',
    label: a('admin.propertyMap.drawButtonLabel', 'Draw button label'),
    defaultValue: 'Draw your area on the map',
    localized: true,
    admin: {
      condition: (_, siblingData) => siblingData?.enableDrawSearch !== false,
    },
  },
  {
    name: 'clusterColors',
    type: 'group',
    label: a('admin.propertyMap.clusterColors', 'Cluster colors'),
    fields: [
      {
        name: 'small',
        type: 'text',
        label: a('admin.propertyMap.clusterColors.small', 'Small cluster'),
        defaultValue: SITE_THEME_TOKEN_DEFAULTS.primary,
      },
      {
        name: 'medium',
        type: 'text',
        label: a('admin.propertyMap.clusterColors.medium', 'Medium cluster'),
        defaultValue: SITE_THEME_TOKEN_DEFAULTS.primary,
      },
      {
        name: 'large',
        type: 'text',
        label: a('admin.propertyMap.clusterColors.large', 'Large cluster'),
        defaultValue: SITE_THEME_TOKEN_DEFAULTS.primary,
      },
    ],
  },
  {
    name: 'mapFetchLimit',
    type: 'number',
    label: a('admin.propertyMap.mapFetchLimit', 'Map fetch limit'),
    defaultValue: 5000,
    min: 1,
    max: 10000000,
    admin: {
      description: a(
        'admin.propertyMap.mapFetchLimit.description',
        'Maximum number of properties to fetch in a single CRM request when loading map markers.',
      ),
    },
  },
]
