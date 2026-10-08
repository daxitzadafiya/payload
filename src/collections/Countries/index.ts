import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
} from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { a } from '@/utilities/adminI18n'
import { localeCodes } from '@/i18n/locales'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

const revalidateCountries: CollectionAfterChangeHook = async ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating countries')
    await revalidateCacheTag('collection_countries')
    for (const locale of localeCodes) {
      await revalidateCacheTag(`collection_countries_${locale}`)
    }
  }
  return doc
}

/** Only one country may be the Sale filter default at a time. */
const clearOtherDefaultCountries: CollectionAfterChangeHook = async ({
  doc,
  req,
  context,
}) => {
  if (context.skipDefaultCountryClear || doc.isDefault !== true) return doc

  const others = await req.payload.find({
    collection: 'countries',
    depth: 0,
    limit: 100,
    pagination: false,
    where: {
      and: [{ id: { not_equals: doc.id } }, { isDefault: { equals: true } }],
    },
  })

  for (const other of others.docs) {
    await req.payload.update({
      collection: 'countries',
      id: other.id,
      data: { isDefault: false },
      depth: 0,
      context: {
        disableRevalidate: true,
        skipDefaultCountryClear: true,
      },
    })
  }

  return doc
}

const ensureDefaultCountryIsForSale: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data

  // Default country must appear in the Sale filter.
  if (data.isDefault === true) {
    data.offerSale = true
  }

  // Clear range selections when a transaction type is turned off.
  if (data.offerSale === false) {
    data.salePriceRanges = []
  }
  if (data.offerRental === false) {
    data.rentalPriceRanges = []
  }
  if (data.offerHoliday === false) {
    data.holidayBudgetRanges = []
  }

  return data
}

export const Countries: CollectionConfig = {
  slug: 'countries',
  labels: {
    singular: a('admin.countries.singular', 'Country'),
    plural: a('admin.countries.plural', 'Countries'),
  },
  access: {
    create: () => false,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'adminLabel',
    defaultColumns: [
      'adminLabel',
      'isoCode',
      'names',
      'offerSale',
      'offerRental',
      'offerHoliday',
      'updatedAt',
    ],
    listSearchableFields: ['adminLabel', 'isoCode', 'names', 'key'],
    description: a(
      'admin.countries.description',
      'CRM countries cached in the CMS. Sync from Optima, then toggle Sale / Rental / Holiday to control which countries appear in each transaction filter. Choose the Default country from the dropdown above the list (Sale-only).',
    ),
    components: {
      beforeListTable: ['@/collections/Countries/CountriesListToolbar#CountriesListToolbar'],
    },
  },
  fields: [
    {
      name: 'adminLabel',
      type: 'text',
      label: a('admin.countries.fields.name', 'Name'),
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'isoCode',
      type: 'text',
      label: a('admin.countries.fields.iso', 'ISO'),
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'key',
      type: 'number',
      label: a('admin.countries.fields.crmKey', 'CRM key'),
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: a(
          'admin.countries.fields.crmKeyDescription',
          'Numeric key sent to the CRM country filter.',
        ),
      },
    },
    {
      name: 'status',
      type: 'text',
      label: a('admin.countries.fields.crmStatus', 'CRM status'),
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'crmId',
      type: 'text',
      label: a('admin.countries.fields.crmId', 'CRM id'),
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'names',
      type: 'json',
      label: a('admin.countries.fields.names', 'Names (all languages)'),
      required: true,
      admin: {
        description: a(
          'admin.countries.fields.namesDescription',
          'Localized country names from CRM. Search works across all languages.',
        ),
        readOnly: true,
        components: {
          Cell: '@/collections/Countries/NamesCell#NamesCell',
        },
      },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      label: a('admin.countries.fields.default', 'Default'),
      defaultValue: false,
      index: true,
      admin: {
        hidden: true,
        disableBulkEdit: true,
        disableListColumn: true,
        disableListFilter: true,
        description: a(
          'admin.countries.fields.defaultDescription',
          'Managed by the Default country dropdown on the Countries list. Only one country can be default.',
        ),
      },
    },
    {
      name: 'offerSale',
      type: 'checkbox',
      label: a('admin.countries.fields.sale', 'Sale'),
      defaultValue: false,
      index: true,
      admin: {
        description: a(
          'admin.countries.fields.saleDescription',
          'Show this country in the Country options for the selected Sales Tab / Property List on Sales Page.',
        ),
        disableBulkEdit: true,
        disableListFilter: true,
      },
    },
    {
      name: 'salePriceRanges',
      type: 'json',
      label: a('admin.countries.fields.salePriceRanges', 'Sale price ranges'),
      defaultValue: [],
      admin: {
        condition: (_, siblingData) => siblingData?.offerSale === true,
        description: a(
          'admin.countries.fields.salePriceRangesDescription',
          'Which Price ranges from Property Filters appear for this country on Sale. Leave empty to show all.',
        ),
        components: {
          Field: '@/collections/Countries/CountryRangeMultiSelect#CountryRangeMultiSelect',
        },
        custom: {
          source: 'priceRanges',
        },
      },
    },
    {
      name: 'offerRental',
      type: 'checkbox',
      label: a('admin.countries.fields.rental', 'Rental'),
      defaultValue: false,
      admin: {
        description: a(
          'admin.countries.fields.rentalDescription',
          'Show this country in the Country options for the selected Rental Tab / Property List on Rental Page.',
        ),
        disableBulkEdit: true,
        disableListFilter: true,
      },
    },
    {
      name: 'rentalPriceRanges',
      type: 'json',
      label: a('admin.countries.fields.rentalPriceRanges', 'Rental price ranges'),
      defaultValue: [],
      admin: {
        condition: (_, siblingData) => siblingData?.offerRental === true,
        description: a(
          'admin.countries.fields.rentalPriceRangesDescription',
          'Which Price ranges from Property Filters appear for this country on Rental. Leave empty to show all.',
        ),
        components: {
          Field: '@/collections/Countries/CountryRangeMultiSelect#CountryRangeMultiSelect',
        },
        custom: {
          source: 'priceRanges',
        },
      },
    },
    {
      name: 'offerHoliday',
      type: 'checkbox',
      label: a('admin.countries.fields.holiday', 'Holiday'),
      defaultValue: false,
      admin: {
        description: a(
          'admin.countries.fields.holidayDescription',
          'Show this country in the Country options for the selected Holiday Tab / Property List on Holiday Rental Page.',
        ),
        disableBulkEdit: true,
        disableListFilter: true,
      },
    },
    {
      name: 'holidayBudgetRanges',
      type: 'json',
      label: a('admin.countries.fields.holidayBudgetRanges', 'Holiday total budget'),
      defaultValue: [],
      admin: {
        condition: (_, siblingData) => siblingData?.offerHoliday === true,
        description: a(
          'admin.countries.fields.holidayBudgetRangesDescription',
          'Which Holiday total budget ranges from Property Filters appear for this country. Leave empty to show all.',
        ),
        components: {
          Field: '@/collections/Countries/CountryRangeMultiSelect#CountryRangeMultiSelect',
        },
        custom: {
          source: 'holidayBudgetRanges',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [ensureDefaultCountryIsForSale],
    afterChange: [clearOtherDefaultCountries, revalidateCountries],
  },
  timestamps: true,
}
