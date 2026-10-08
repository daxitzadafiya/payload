import { aString } from '@/utilities/adminI18n'

/**
 * Registers dashboard hero copy for admin.* DeepL seed (en + account languages).
 * Imported from payload.config so keys exist before onInit seed runs.
 */
export const DASHBOARD_HERO_I18N = {
  eyebrow: ['admin.dashboardHero.eyebrow', 'Property content studio'],
  title: ['admin.dashboardHero.title', 'Manage the site from one desk'],
  text: [
    'admin.dashboardHero.text',
    'Pages, listings, and agency settings — arranged the way your team already works.',
  ],
  chipListings: ['admin.dashboardHero.chipListings', 'Listings'],
  chipPages: ['admin.dashboardHero.chipPages', 'Pages'],
  chipGlobals: ['admin.dashboardHero.chipGlobals', 'Globals'],
} as const

for (const [key, english] of Object.values(DASHBOARD_HERO_I18N)) {
  aString(key, english)
}
