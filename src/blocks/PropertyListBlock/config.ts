import type { Block, FieldHook } from 'payload'

import { a, aString } from '@/utilities/adminI18n'

/** Favorites-only copy — do not persist or expose when Property collection is anything else. */
const clearEmptyStateUnlessFavorites: FieldHook = ({ siblingData, value }) => {
  if (siblingData?.listingPreset !== 'favorites') return null
  return value
}

const favoritesEmptyStateHooks = {
  beforeChange: [clearEmptyStateUnlessFavorites],
  afterRead: [clearEmptyStateUnlessFavorites],
}

/** City key only applies when Property collection is city-wise. */
const clearCrmCityUnlessCityWise: FieldHook = ({ siblingData, value }) => {
  if (siblingData?.listingPreset !== 'cityWise') return null
  return value
}

/** Custom CRM JSON only applies when Property collection is Custom CRM Query. */
const clearCrmQueryUnlessCustom: FieldHook = ({ siblingData, value }) => {
  if (siblingData?.listingPreset !== 'custom') return null
  return value
}

export const PropertyListBlock: Block = {
  slug: 'propertyListBlock',
  interfaceName: 'PropertyListBlock',
  labels: {
    singular: a('admin.blocks.propertyListBlock.singular', 'Property List'),
    plural: a('admin.blocks.propertyListBlock.plural', 'Property Lists'),
  },
  fields: [
    {
      name: 'showBreadcrumb',
      type: 'checkbox',
      label: a('admin.blocks.propertyListBlock.showBreadcrumbLabel', 'Show breadcrumb'),
      defaultValue: true,
    },
    {
      name: 'breadcrumbParentLabel',
      type: 'text',
      label: a('admin.blocks.propertyListBlock.breadcrumbParentLabel', 'Breadcrumb parent label'),
      defaultValue: 'Home',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.showBreadcrumb !== false,
      },
    },
    {
      name: 'breadcrumbParentHref',
      type: 'text',
      label: a('admin.blocks.propertyListBlock.breadcrumbParentHrefLabel', 'Breadcrumb parent URL'),
      defaultValue: '/',
      admin: {
        condition: (_, siblingData) => siblingData?.showBreadcrumb !== false,
      },
    },
    {
      name: 'pageTitle',
      type: 'text',
      label: a(
        'admin.blocks.propertyListBlock.pageTitleLabel',
        'Page heading (optional — use Hero tab if empty)',
      ),
      localized: true,
    },
    {
      name: 'resultsLabel',
      type: 'text',
      label: a('admin.blocks.propertyListBlock.resultsLabel', 'Results count suffix'),
      defaultValue: 'extraordinary properties',
      localized: true,
    },
    {
      name: 'listingPreset',
      type: 'select',
      label: a('admin.blocks.propertyListBlock.listingPresetLabel', 'Property collection'),
      required: true,
      defaultValue: 'forSale',
      options: [
        {
          label: a('admin.blocks.propertyListBlock.listingForSale', 'Property for Sale'),
          value: 'forSale',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingForRent', 'Property for Rent'),
          value: 'forRent',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingForHoliday', 'Holiday Rentals'),
          value: 'forHoliday',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingProjects', 'Projects'),
          value: 'projects',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingFavorites', 'Favorites'),
          value: 'favorites',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingSold', 'Sold Properties'),
          value: 'sold',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingFeatured', 'Featured Properties'),
          value: 'featured',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingSeaView', 'Sea View Properties'),
          value: 'seaView',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingBeachSide', 'Beach Side Properties'),
          value: 'beachSide',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingGolf', 'Golf Properties'),
          value: 'golf',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingLuxury', 'Luxury Properties'),
          value: 'luxury',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingNewDevelopments', 'New Developments'),
          value: 'newDevelopments',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingNewListings', 'New Listings'),
          value: 'newListings',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingCityWise', 'City-wise Properties'),
          value: 'cityWise',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingResaleHomes', 'Resale Homes'),
          value: 'resaleHomes',
        },
        {
          label: a('admin.blocks.propertyListBlock.listingCustom', 'Custom CRM Query'),
          value: 'custom',
        },
      ],
    },
    {
      name: 'crmCity',
      type: 'number',
      label: a('admin.blocks.propertyListBlock.crmCityLabel.property_list_block', 'City'),
      hooks: {
        beforeChange: [clearCrmCityUnlessCityWise],
      },
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'cityWise',
        placeholder: a(
          'admin.blocks.propertyListBlock.crmCityPlaceholder',
          'Select a city…',
        ),
        custom: {
          // Keep the locale map here. The custom Field component receives `field.label`
          // already resolved to English, so it cannot switch with the admin language.
          fieldLabel: a(
            'admin.blocks.propertyListBlock.crmCityLabel.property_list_block',
            'City',
          ),
          loadingPlaceholder: a(
            'admin.blocks.propertyListBlock.crmCityLoadingPlaceholder',
            'Loading cities…',
          ),
        },
        components: {
          Field: '@/blocks/PropertyListBlock/CRMCityField#CRMCityField',
        },
      },
      validate: (
        value: unknown,
        { siblingData, req }: { siblingData?: unknown; req?: { i18n?: { language?: string } } },
      ) => {
        if (siblingData && typeof siblingData === 'object' && 'listingPreset' in siblingData) {
          if ((siblingData as { listingPreset?: string }).listingPreset !== 'cityWise') return true
        }
        if (value == null || !Number.isFinite(Number(value))) {
          return aString(
            'admin.blocks.propertyListBlock.crmCityRequired',
            'Select a city for city-wise properties.',
            req?.i18n?.language,
          )
        }
        return true
      },
    },
    {
      name: 'crmQueryJson',
      type: 'textarea',
      label: a('admin.blocks.propertyListBlock.crmQueryJsonLabel', 'Custom CRM query'),
      hooks: {
        beforeChange: [clearCrmQueryUnlessCustom],
        afterRead: [clearCrmQueryUnlessCustom],
      },
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'custom',
        description: a(
          'admin.blocks.propertyListBlock.crmQueryJsonDescription',
          'Paste a CRM JSON object. You can paste a full `{ "options": ..., "query": ... }` payload or just the query body.',
        ),
        placeholder: '{ "query": { "sale": true } }',
        rows: 10,
      },
      validate: (value: unknown, { siblingData }: { siblingData?: unknown }) => {
        if (siblingData && typeof siblingData === 'object' && 'listingPreset' in siblingData) {
          if ((siblingData as { listingPreset?: string }).listingPreset !== 'custom') return true
        }
        if (typeof value !== 'string' || !value.trim()) {
          return 'Enter a CRM query JSON object.'
        }
        return true
      },
    },
    {
      name: 'pageSize',
      type: 'number',
      label: a('admin.blocks.propertyListBlock.pageSizeLabel', 'Properties per page'),
      defaultValue: 9,
      min: 1,
      max: 48,
    },
    {
      name: 'showFilters',
      type: 'checkbox',
      label: a('admin.blocks.propertyListBlock.showFiltersLabel', 'Show search filters'),
      defaultValue: true,
    },
    {
      name: 'showMap',
      type: 'checkbox',
      label: a('admin.blocks.propertyListBlock.showMapLabel', 'Show map search'),
      defaultValue: false,
      admin: {
        description: a(
          'admin.blocks.propertyListBlock.showMapDescription',
          'Adds a map icon in the filter bar that opens the map modal. For Projects, markers load from constructions with latlng=true (same filters), then area search filters by selected project IDs.',
        ),
        condition: (_, siblingData) => siblingData?.showFilters !== false,
      },
    },
    {
      name: 'forceSoldBadge',
      type: 'checkbox',
      label: a('admin.blocks.propertyListBlock.forceSoldBadgeLabel', 'Show SOLD badge on all cards'),
      defaultValue: false,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'sold',
      },
    },
    {
      name: 'emptyStateNoFavoritesTitle',
      type: 'text',
      label: a(
        'admin.blocks.propertyListBlock.emptyStateNoFavoritesTitleLabel',
        'Empty state title (no saved favorites)',
      ),
      localized: true,
      hooks: favoritesEmptyStateHooks,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'favorites',
        placeholder: 'No favorites yet',
      },
    },
    {
      name: 'emptyStateNoFavoritesDescription',
      type: 'textarea',
      label: a(
        'admin.blocks.propertyListBlock.emptyStateNoFavoritesDescriptionLabel',
        'Empty state description (no saved favorites)',
      ),
      localized: true,
      hooks: favoritesEmptyStateHooks,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'favorites',
        placeholder:
          "You haven't favorited any properties yet. Browse our listings and tap the heart on any property to save it here.",
      },
    },
    {
      name: 'emptyStateNoResultsTitle',
      type: 'text',
      label: a(
        'admin.blocks.propertyListBlock.emptyStateNoResultsTitleLabel',
        'Empty state title (filters match nothing)',
      ),
      localized: true,
      hooks: favoritesEmptyStateHooks,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'favorites',
        placeholder: 'No matching favorites',
      },
    },
    {
      name: 'emptyStateNoResultsDescription',
      type: 'textarea',
      label: a(
        'admin.blocks.propertyListBlock.emptyStateNoResultsDescriptionLabel',
        'Empty state description (filters match nothing)',
      ),
      localized: true,
      hooks: favoritesEmptyStateHooks,
      admin: {
        condition: (_, siblingData) => siblingData?.listingPreset === 'favorites',
        placeholder:
          'None of your saved properties match these filters. Try adjusting your search or add more favorites from our listings.',
      },
    },
  ],
}
