import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { a } from '@/utilities/adminI18n'
import { invalidateWeatherCache } from '@/utilities/weather/cache'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'

export const WeatherSettings: GlobalConfig = {
  slug: 'weatherSettings',
  label: a('admin.weatherSettings.label', 'Weather'),
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    description: a(
      'admin.weatherSettings.description',
      'WeatherAPI.com credentials and cache settings for the hero search bar. API responses are cached server-side to reduce external API calls.',
    ),
    group: a('admin.groups.settings', 'Settings'),
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: a('admin.weatherSettings.enabled', 'Show weather in hero search bar'),
      defaultValue: true,
    },
    {
      name: 'baseUrl',
      type: 'text',
      label: a('admin.weatherSettings.baseUrl', 'API base URL'),
      defaultValue: 'https://api.weatherapi.com/v1/current.json',
      admin: {
        readOnly: true,
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description: a(
          'admin.weatherSettings.baseUrl.description',
          'Fixed WeatherAPI.com endpoint — not editable.',
        ),
      },
    },
    {
      name: 'apiKey',
      type: 'text',
      label: a('admin.weatherSettings.apiKey', 'API key'),
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description: a(
          'admin.weatherSettings.apiKey.description',
          'Your WeatherAPI.com key. Stored in the database — not in environment variables.',
        ),
      },
    },
    {
      name: 'location',
      type: 'text',
      label: a('admin.weatherSettings.location', 'Location query'),
      defaultValue: 'Javea',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description: a(
          'admin.weatherSettings.location.description',
          'City name or coordinates passed as the q parameter (e.g. Javea, Athens).',
        ),
      },
    },
    {
      name: 'cacheIntervalMinutes',
      type: 'number',
      label: a('admin.weatherSettings.cacheIntervalMinutes', 'Cache refresh interval (minutes)'),
      defaultValue: 5,
      min: 1,
      max: 120,
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.enabled),
        description: a(
          'admin.weatherSettings.cacheIntervalMinutes.description',
          'How long to reuse a cached API response before fetching fresh data from WeatherAPI.com.',
        ),
      },
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        invalidateWeatherCache()
        await revalidateCacheTag('global_weatherSettings')
      },
    ],
  },
}
