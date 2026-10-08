import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { a } from '@/utilities/adminI18n'
import { invalidateOptimaCrmSettingsCache } from '@/settings/optimaCrm/client'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const OptimaCrmSettings: GlobalConfig = {
  slug: 'optimaCrmSettings',
  // Shorten versioned table/enum identifiers (SQLite 63-char limit).
  dbName: 'optima_crm',
  label: a('admin.optimaCrmSettings.label', 'Optima CRM'),
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description: a(
      'admin.optimaCrmSettings.description',
      'Configure property listing queries and which CRM fields are shown as REF on property and project pages.',
    ),
    group: a('admin.groups.settings', 'Settings'),
  },
  fields: [
    // Kept in schema for DB compatibility; values come from ENV (see settings/optimaCrm/shared.ts).
    // Use top-level `hidden` (not admin.hidden) so RenderFields skips them entirely and
    // the next group keeps :first-child spacing (admin.hidden leaves empty inputs that break that).
    {
      name: 'api',
      type: 'group',
      hidden: true,
      label: a('admin.optimaCrmSettings.api', 'API credentials'),
      fields: [
        {
          name: 'apiUrl',
          type: 'text',
          label: a('admin.optimaCrmSettings.api.apiUrl', 'CRM API URL (v3)'),
          admin: {
            description: a(
              'admin.optimaCrmSettings.api.apiUrl.description',
              'Base URL for Optima v3 API (e.g. https://your-crm.optima-crm.com/v3).',
            ),
          },
        },
        {
          name: 'apiKey',
          type: 'text',
          label: a('admin.optimaCrmSettings.api.apiKey', 'CRM API key'),
          admin: {
            description: a(
              'admin.optimaCrmSettings.api.apiKey.description',
              'Sent as user_apikey on CRM requests.',
            ),
          },
        },
        {
          name: 'contactUrl',
          type: 'text',
          label: a('admin.optimaCrmSettings.api.contactUrl', 'Contact form URL (Yii)'),
          admin: {
            description: a(
              'admin.optimaCrmSettings.api.contactUrl.description',
              'Yii endpoint for PDF brochures (?r=pdf) and other Yii routes. Account creation uses the Nest /public/accounts URL.',
            ),
          },
        },
        {
          name: 'userKey',
          type: 'text',
          label: a('admin.optimaCrmSettings.api.userKey', 'Optima user key'),
          admin: {
            description: a(
              'admin.optimaCrmSettings.api.userKey.description',
              'Used for property detail view and PDF brochure generation.',
            ),
          },
        },
        {
          name: 'brochureTemplateId',
          type: 'number',
          label: a('admin.optimaCrmSettings.api.brochureTemplateId', 'Brochure template ID'),
          defaultValue: 39,
          admin: {
            description: a(
              'admin.optimaCrmSettings.api.brochureTemplateId.description',
              'Optima PDF template ID for property brochures.',
            ),
          },
        },
      ],
    },
    {
      name: 'images',
      type: 'group',
      hidden: true,
      label: a('admin.optimaCrmSettings.images', 'Image CDN'),
      admin: {
        description: a(
          'admin.optimaCrmSettings.images.description',
          'Optima image URL bases. Defaults match the standard Optima CDN if left empty.',
        ),
      },
      fields: [
        {
          name: 'imageUrlWithoutResize',
          type: 'text',
          defaultValue: 'https://images.optima-crm.com/cms_medias/',
          label: a('admin.optimaCrmSettings.images.imageUrlWithoutResize', 'Image URL Without Resize'),
        },
        {
          name: 'imageUrl',
          type: 'text',
          defaultValue: 'https://images.optima-crm.com/resize/cms_medias/',
          label: a('admin.optimaCrmSettings.images.imageUrl', 'Image URL'),
        },
        {
          name: 'commercialImageBase',
          type: 'text',
          defaultValue: 'https://images.optima-crm.com/commercial_images',
          label: a('admin.optimaCrmSettings.images.commercialImageBase', 'Commercial Image Base'),
        },
        {
          name: 'constructionsImageBase',
          type: 'text',
          defaultValue: 'https://images.optima-crm.com/constructions_images',
          label: a('admin.optimaCrmSettings.images.constructionsImageBase', 'Constructions Image Base'),
          admin: {
            description: a(
              'admin.optimaCrmSettings.images.constructionsImageBase.description',
              'Base URL for construction/project document files.',
            ),
          },
        },
        {
          name: 'agencyId',
          type: 'text',
          label: a('admin.optimaCrmSettings.images.agencyId', 'Agency ID'),
          admin: {
            description: a(
              'admin.optimaCrmSettings.images.agencyId.description',
              'Optima agency ID for commercial images.',
            ),
          },
        },
        {
          name: 'propertyResizeBase',
          type: 'text',
          defaultValue: 'https://images.optima-crm.com/resize/',
          label: a('admin.optimaCrmSettings.images.propertyResizeBase', 'Property Resize Base'),
        },
        {
          name: 'siteId',
          type: 'text',
          defaultValue: '237',
          label: a('admin.optimaCrmSettings.images.siteId', 'Site ID'),
        },
      ],
    },
    {
      name: 'imageDisplay',
      type: 'group',
      label: a('admin.optimaCrmSettings.imageDisplay', 'Images'),
      fields: [
        {
          name: 'propertyImages',
          type: 'select',
          label: a(
            'admin.optimaCrmSettings.imageDisplay.propertyImages',
            'Property/Project Images',
          ),
          defaultValue: 'without_watermark',
          required: true,
          options: [
            {
              label: a(
                'admin.optimaCrmSettings.imageDisplay.propertyImages.withoutWatermark',
                'Without Watermark',
              ),
              value: 'without_watermark',
            },
            {
              label: a(
                'admin.optimaCrmSettings.imageDisplay.propertyImages.withWatermark',
                'With Watermark',
              ),
              value: 'with_watermark',
            },
          ],
          admin: {
            description: a(
              'admin.optimaCrmSettings.imageDisplay.propertyImages.description',
              'Without watermark uses the existing resize URL. With watermark inserts the agency ID from NEXT_PUBLIC_OPTIMA_AGENCY_ID.',
            ),
          },
        },
      ],
    },
    {
      name: 'properties',
      type: 'group',
      label: a('admin.optimaCrmSettings.properties', 'Property queries'),
      fields: [
        {
          name: 'similarCommercials',
          dbName: 'simCom',
          type: 'select',
          label: a('admin.optimaCrmSettings.properties.similarCommercials', 'Similar commercials'),
          defaultValue: 'exclude_similar',
          required: true,
          options: [
            {
              label: a(
                'admin.optimaCrmSettings.properties.similarCommercials.excludeSimilar',
                'Exclude similar',
              ),
              value: 'exclude_similar',
            },
            {
              label: a(
                'admin.optimaCrmSettings.properties.similarCommercials.includeSimilar',
                'Include similar',
              ),
              value: 'include_similar',
            },
            {
              label: a(
                'admin.optimaCrmSettings.properties.similarCommercials.onlySimilar',
                'Only similar',
              ),
              value: 'only_similar',
            },
          ],
          admin: {
            description: a(
              'admin.optimaCrmSettings.properties.similarCommercials.description',
              'Controls the similar_commercials parameter on all CRM property listing requests.',
            ),
          },
        },
      ],
    },
    {
      name: 'reference',
      type: 'group',
      label: a('admin.optimaCrmSettings.reference', 'Reference'),
      admin: {
        description: a(
          'admin.optimaCrmSettings.reference.description',
          'Choose which CRM field is shown as REF on property/project lists, carousels, and detail pages. Falls back to system reference when empty.',
        ),
      },
      fields: [
        {
          name: 'propertyField',
          dbName: 'propRef',
          type: 'select',
          label: a(
            'admin.optimaCrmSettings.reference.propertyField',
            'Property reference field',
          ),
          defaultValue: 'reference',
          required: true,
          options: [
            {
              label: a(
                'admin.optimaCrmSettings.reference.propertyField.reference',
                'Reference',
              ),
              value: 'reference',
            },
            {
              label: a(
                'admin.optimaCrmSettings.reference.propertyField.externalReference',
                'External reference',
              ),
              value: 'external_reference',
            },
            {
              label: a(
                'admin.optimaCrmSettings.reference.propertyField.otherReference',
                'Other reference',
              ),
              value: 'other_reference',
            },
          ],
          admin: {
            description: a(
              'admin.optimaCrmSettings.reference.propertyField.description',
              'CRM key shown as REF for properties. If selected field value is empty on a listing then fallback to Reference instead to show as REF.',
            ),
          },
        },
        {
          name: 'projectField',
          dbName: 'projRef',
          type: 'select',
          label: a(
            'admin.optimaCrmSettings.reference.projectField',
            'Project reference field',
          ),
          defaultValue: 'reference',
          required: true,
          options: [
            {
              label: a(
                'admin.optimaCrmSettings.reference.projectField.reference',
                'Reference',
              ),
              value: 'reference',
            },
            {
              label: a(
                'admin.optimaCrmSettings.reference.projectField.otherReference',
                'Other Reference',
              ),
              value: 'Agency_reference',
            },
            {
              label: a(
                'admin.optimaCrmSettings.reference.projectField.userReference',
                'User Reference',
              ),
              value: 'user_reference',
            },
          ],
          admin: {
            description: a(
              'admin.optimaCrmSettings.reference.projectField.description',
              'CRM key shown as REF for Projects. If selected field value is empty on a listing then fallback to Reference instead to show as REF.',
            ),
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        invalidateOptimaCrmSettingsCache()
        await revalidateCacheTag('global_optimaCrmSettings')
      },
    ],
  },
}
