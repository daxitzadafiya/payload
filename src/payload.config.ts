import { sqliteAdapter } from '@payloadcms/db-sqlite'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Translations } from './collections/Translations'
import { Countries } from './collections/Countries'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { CookieConsent } from './globals/CookieConsent/config'
import { DeepLSettings } from './globals/DeepLSettings/config'
import { EmailSettings } from './globals/EmailSettings/config'
import { IntegrationsSettings } from './globals/IntegrationsSettings/config'
import { WeatherSettings } from './globals/WeatherSettings/config'
import { Localization } from './globals/Localization/config'
import { SiteLogo } from './globals/Logo/config'
import { OptimaCrmSettings } from './globals/OptimaCrmSettings/config'
import { PropertyFilters } from './globals/PropertyFilters/config'
import { PropertyMap } from './globals/PropertyMap/config'
import { emailAdapter } from './email/configureEmailAdapter'
import { Theme } from './globals/Theme/config'
import { payloadLocalization } from './i18n/locales'
import { adminLanguagePacks } from './i18n/adminLanguagePacks'
import { syncAdminLanguagesFromLocalization } from './i18n/syncAdminLanguagesFromLocalization'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { hasAdminCredentials } from './constants/adminUser'
import { ensureAdminUser } from './utilities/ensureAdminUser'
import { seedAdminTranslations } from './utilities/adminI18n'
import { migrations } from './migrations'
import './components/AdminDashboardHero/i18n'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: getServerSideURL(),

  // Admin UI languages for Account → Language.
  // Full pack pool; syncAdminLanguagesFromLocalization() keeps only languages
  // enabled in Globals → Localization (and always keeps `en`).
  i18n: {
    supportedLanguages: {
      en: adminLanguagePacks.en,
      de: adminLanguagePacks.de,
      es: adminLanguagePacks.es,
      fr: adminLanguagePacks.fr,
      it: adminLanguagePacks.it,
      nl: adminLanguagePacks.nl,
    },
  },

  // localization (content locales — see src/i18n/locales.ts to add codes)
  localization: payloadLocalization,

  email: emailAdapter,
  onInit: async (payload) => {
    payload.logger.info('=== onInit called ===')
    payload.logger.info(`DATABASE_URL: ${process.env.DATABASE_URL}`)
    payload.logger.info(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL}`)

    // Skip during `next build` — workers initialize Payload in parallel and SQLite locks
    if (process.env.NEXT_PHASE === 'phase-production-build') return

    if (hasAdminCredentials()) {
      payload.logger.info('=== hasAdminCredentials ===')
      await ensureAdminUser(payload)
    }

    let adminLanguageCodes: string[] = ['en']
    try {
      adminLanguageCodes = await syncAdminLanguagesFromLocalization(payload)
    } catch (error) {
      payload.logger.error({ err: error }, '[adminLanguages] Failed to sync Account Language options')
    }

    // Populate Translations (admin.*) for Localization Account Languages only.
    // Runs in the background so first boot / new projects are not blocked on DeepL.
    // Admin layout `ensureAdminI18nSynced` awaits the same shared promise when needed.
    void seedAdminTranslations(payload, { locales: adminLanguageCodes }).catch((error) => {
      payload.logger.error({ err: error }, '[adminI18n] Failed to seed admin translations')
    })
  },
  admin: {
    // Avoid recoverable hydration mismatches in admin (style FOUC / extensions / Next 16)
    suppressHydrationWarning: true,
    // Lock admin chrome to light; hides Account → Payload Settings → Admin Theme.
    theme: 'light',
    components: {
      graphics: {
        Icon: '@/components/Icon/Icon',
        Logo: '@/components/Logo/Logo',
      },
      views: {
        forgot: {
          Component: '@/components/ForgotPasswordView',
        },
        reset: {
          Component: '@/components/ResetPasswordView',
        },
      },

      // Soft ornaments around the auth glass card.
      beforeLogin: ['@/components/BeforeLogin'],
      // Branded welcome strip on the dashboard (visual only).
      beforeDashboard: ['@/components/AdminDashboardHero'],
      // // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // // Feel free to delete this at any time. Simply remove the line below.
      // beforeDashboard: ['@/components/BeforeDashboard'],
    },
    meta: {
      icons: [
        {
          rel: 'icon',
          url: '/site-favicon',
        },
      ],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: sqliteAdapter({
    client: {
      // Keep dev/runtime aligned with migration CLI when env loading varies.
      url: process.env.DATABASE_URL || 'file:./roumpos.db',
    },
    // Wait on SQLITE_BUSY instead of failing when auto-translate runs after save.
    busyTimeout: 10_000,
    // WAL + concurrent Next.js workers can corrupt local SQLite; keep WAL for production only.
    wal: process.env.NODE_ENV === 'production',
    // Use migrations in production; dev schema push leaves a batch=-1 marker that
    // blocks non-interactive `next build` with an interactive migrate prompt.
    push: false,
    prodMigrations: migrations,
  }),
  collections: [Pages, Posts, Media, Categories, Users, Translations, Countries],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [
    Header,
    Footer,
    Theme,
    Localization,
    SiteLogo,
    CookieConsent,
    PropertyMap,
    PropertyFilters,
    EmailSettings,
    OptimaCrmSettings,
    DeepLSettings,
    IntegrationsSettings,
    WeatherSettings,
  ],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
