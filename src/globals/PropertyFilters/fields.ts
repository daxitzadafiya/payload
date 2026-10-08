import type { ArrayField, Field } from 'payload'

import { a } from '@/utilities/adminI18n'

import {
  dropEmptyOptionRows,
  ensureLocalizedOptionLabel,
  flattenOptionLabelsForSave,
  pinRequestLocale,
} from './hooks/ensureOptionLabels'

const COL_HALF = '50%' as const

const sortOptionFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'value',
        type: 'text',
        label: a('admin.propertyFilters.sortOptions.value', 'Value'),
        required: true,
        admin: {
          width: '30%',
          description: a(
            'admin.propertyFilters.sortOptions.value.description',
            'Unique key for this sort option.',
          ),
        },
      },
      {
        name: 'label',
        type: 'text',
        label: a('admin.propertyFilters.sortOptions.label', 'Label'),
        required: true,
        localized: true,
        hooks: {
          beforeChange: [ensureLocalizedOptionLabel],
        },
        admin: {
          width: '30%',
        },
      },
      {
        name: 'sortParams',
        type: 'textarea',
        label: a('admin.propertyFilters.sortOptions.sortParams', 'CRM sort parameters'),
        required: true,
        admin: {
          width: '40%',
          description: a(
            'admin.propertyFilters.sortOptions.sortParams.description',
            'JSON merged into options.sort (e.g. {"created_at": -1}, {"current_price": 1}, {"updated_at": true}).',
          ),
        },
      },
    ],
  },
]

const filterOptionFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'value',
        type: 'text',
        label: a('admin.propertyFilters.filterOptions.value', 'Value'),
        required: true,
        admin: {
          width: '40%',
          description: a(
            'admin.propertyFilters.filterOptions.value.description',
            'CRM filter value sent with the search query.',
          ),
        },
      },
      {
        name: 'label',
        type: 'text',
        label: a('admin.propertyFilters.filterOptions.label', 'Label'),
        required: true,
        localized: true,
        hooks: {
          beforeChange: [ensureLocalizedOptionLabel],
        },
        admin: {
          width: '60%',
        },
      },
    ],
  },
]

const priceRangeFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'value',
        type: 'text',
        label: a('admin.propertyFilters.priceRanges.value', 'Value'),
        required: true,
        admin: {
          width: '25%',
          description: a(
            'admin.propertyFilters.priceRanges.value.description',
            'Unique key (e.g. 500k-1m).',
          ),
        },
      },
      {
        name: 'label',
        type: 'text',
        label: a('admin.propertyFilters.priceRanges.label', 'Label'),
        required: true,
        localized: true,
        hooks: {
          beforeChange: [ensureLocalizedOptionLabel],
        },
        admin: {
          width: '25%',
          description: a(
            'admin.propertyFilters.priceRanges.label.description',
            'Shown in the filter dropdown. If empty, the Value is used.',
          ),
        },
      },
      {
        name: 'min',
        type: 'text',
        label: a('admin.propertyFilters.priceRanges.min', 'Min price'),
        required: true,
        admin: {
          width: '25%',
          description: a(
            'admin.propertyFilters.priceRanges.min.description',
            'CRM value or "any".',
          ),
        },
      },
      {
        name: 'max',
        type: 'text',
        label: a('admin.propertyFilters.priceRanges.max', 'Max price'),
        required: true,
        admin: {
          width: '25%',
          description: a(
            'admin.propertyFilters.priceRanges.max.description',
            'CRM value or "any".',
          ),
        },
      },
    ],
  },
]

function filterArrayField(
  config: Omit<ArrayField, 'type' | 'admin'> & {
    admin?: ArrayField['admin'] & { width?: string }
  },
): ArrayField {
  const { admin, hooks, ...field } = config

  return {
    ...field,
    type: 'array',
    hooks: {
      ...hooks,
      beforeChange: [
        ({ value, req }) =>
          dropEmptyOptionRows(
            flattenOptionLabelsForSave(value, pinRequestLocale(req)),
          ),
        ...(hooks?.beforeChange || []),
      ],
    },
    admin: {
      initCollapsed: true,
      ...admin,
    },
  }
}

export const propertyFiltersFields: Field[] = [
  filterArrayField({
    name: 'sortOptions',
    label: a('admin.propertyFilters.sortOptions', 'Sort options'),
    admin: {
      width: '100%',
      initCollapsed: false,
      description: a(
        'admin.propertyFilters.sortOptions.description',
        'Options for the property list “Sort by” dropdown. Each row maps to CRM options.sort.',
      ),
    },
    defaultValue: [
      { value: 'recent', label: 'Recent', sortParams: '{"created_at": -1}' },
      { value: 'relevance', label: 'Relevance', sortParams: '{"featured": -1}' },
      { value: 'priceAsc', label: 'Lowest Price', sortParams: '{"current_price": 1}' },
      { value: 'priceDesc', label: 'Highest Price', sortParams: '{"current_price": -1}' },
    ],
    fields: sortOptionFields,
  }),
  filterArrayField({
    name: 'priceRanges',
    label: a('admin.propertyFilters.priceRanges', 'Price ranges'),
    admin: {
      width: '100%',
      initCollapsed: false,
      description: a(
        'admin.propertyFilters.priceRanges.description',
        'Used in the main filter bar and hero search.',
      ),
    },
    defaultValue: [
      { value: 'any', label: 'Any Price', min: 'any', max: 'any' },
      { value: '500k-1m', label: '€500k - €1M', min: '500000', max: '1000000' },
      { value: '1m-3m', label: '€1M - €3M', min: '1000000', max: '3000000' },
      { value: '3m-10m', label: '€3M - €10M', min: '3000000', max: '10000000' },
      { value: '10m+', label: '€10M+', min: '10000000', max: 'any' },
    ],
    fields: priceRangeFields,
  }),
  {
    type: 'row',
    fields: [
      filterArrayField({
        name: 'bedrooms',
        label: a('admin.propertyFilters.bedrooms', 'Bedrooms'),
        admin: {
          width: COL_HALF,
          description: a(
            'admin.propertyFilters.bedrooms.description',
            'Exact bedroom counts. Use value "other" for the custom-number option.',
          ),
        },
        defaultValue: [
          { value: 'any', label: 'Any Bedrooms' },
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: 'other', label: 'Need More' },
        ],
        fields: filterOptionFields,
      }),
      filterArrayField({
        name: 'bathrooms',
        label: a('admin.propertyFilters.bathrooms', 'Bathrooms'),
        admin: {
          width: COL_HALF,
          description: a(
            'admin.propertyFilters.bathrooms.description',
            'Exact bathroom counts. Use value "other" for the custom-number option.',
          ),
        },
        defaultValue: [
          { value: 'any', label: 'Any Bathrooms' },
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: 'other', label: 'Need More' },
        ],
        fields: filterOptionFields,
      }),
    ],
  },
  // Min/Max dropdowns on the site are derived from `priceRanges`.
  // Keep the fields hidden so existing DB data is harmless but not editable.
  filterArrayField({
    name: 'minPrices',
    label: a('admin.propertyFilters.minPrices', 'Min price'),
    admin: {
      hidden: true,
      disableListColumn: true,
    },
    defaultValue: [],
    fields: filterOptionFields,
  }),
  filterArrayField({
    name: 'maxPrices',
    label: a('admin.propertyFilters.maxPrices', 'Max price'),
    admin: {
      hidden: true,
      disableListColumn: true,
    },
    defaultValue: [],
    fields: filterOptionFields,
  }),
  {
    type: 'row',
    fields: [
      filterArrayField({
        name: 'features',
        label: a('admin.propertyFilters.features', 'Features'),
        admin: {
          width: '100%',
          description: a(
            'admin.propertyFilters.features.description',
            'Values must be "sea views", "mountain", or "golf".',
          ),
        },
        defaultValue: [
          { value: 'sea views', label: 'Sea view' },
          { value: 'mountain', label: 'Mountain' },
          { value: 'golf', label: 'Golf' },
        ],
        fields: filterOptionFields,
      }),
    ],
  },
  {
    type: 'row',
    fields: [
      filterArrayField({
        name: 'deliveryDates',
        label: a('admin.propertyFilters.deliveryDates', 'Delivery date'),
        admin: {
          width: COL_HALF,
          description: a(
            'admin.propertyFilters.deliveryDates.description',
            'Project listing “Delivery date” options. Value is months (1 = key ready / handover). Use "any" for no filter.',
          ),
        },
        defaultValue: [
          { value: 'any', label: 'Any delivery' },
          { value: '1', label: 'Key ready' },
          { value: '3', label: '3 months' },
          { value: '6', label: '6 months' },
          { value: '12', label: '12 months' },
          { value: '18', label: '18 months' },
          { value: '60', label: '18 months or older' },
        ],
        fields: filterOptionFields,
      }),
      filterArrayField({
        name: 'distanceToSea',
        label: a('admin.propertyFilters.distanceToSea', 'Distance to the sea'),
        admin: {
          width: COL_HALF,
          description: a(
            'admin.propertyFilters.distanceToSea.description',
            'Project listing distance options. Value is meters. Use "any" or "1000000" for no filter.',
          ),
        },
        defaultValue: [
          { value: 'any', label: 'Distance to the sea' },
          { value: '600', label: 'Less than 600 m' },
          { value: '1000', label: 'Less than 1 km' },
          { value: '3000', label: 'Less than 3 km' },
          { value: '6000', label: 'Less than 6 km' },
          { value: '12000', label: 'Less than 12 km' },
          { value: '1000000', label: 'Indifferent' },
        ],
        fields: filterOptionFields,
      }),
    ],
  },
  {
    type: 'row',
    fields: [
      filterArrayField({
        name: 'guests',
        label: a('admin.propertyFilters.guests', 'Holiday guests'),
        admin: {
          width: COL_HALF,
          description: a(
            'admin.propertyFilters.guests.description',
            'Guest count options for holiday rental search.',
          ),
        },
        defaultValue: [
          { value: 'any', label: 'Any Guests' },
          { value: '1', label: '1 Guest' },
          { value: '2', label: '2 Guests' },
          { value: '3', label: '3 Guests' },
          { value: '4', label: '4 Guests' },
          { value: '5', label: '5 Guests' },
          { value: '6', label: '6 Guests' },
          { value: '8', label: '8 Guests' },
          { value: '10', label: '10+ Guests' },
        ],
        fields: filterOptionFields,
      }),
      filterArrayField({
        name: 'holidayBudgetRanges',
        label: a('admin.propertyFilters.holidayBudgetRanges', 'Holiday total budget'),
        admin: {
          width: COL_HALF,
          description: a(
            'admin.propertyFilters.holidayBudgetRanges.description',
            'Budget ranges for holiday rental search (hero + holiday listing filters).',
          ),
        },
        defaultValue: [
          { value: 'any', label: 'Any Budget', min: 'any', max: 'any' },
          { value: '0-500', label: 'Up to €500', min: '0', max: '500' },
          { value: '500-1000', label: '€500 - €1,000', min: '500', max: '1000' },
          { value: '1000-2500', label: '€1,000 - €2,500', min: '1000', max: '2500' },
          { value: '2500-5000', label: '€2,500 - €5,000', min: '2500', max: '5000' },
          { value: '5000+', label: '€5,000+', min: '5000', max: 'any' },
        ],
        fields: priceRangeFields,
      }),
    ],
  },
]
