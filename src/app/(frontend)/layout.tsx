import type { Metadata, Viewport } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { EB_Garamond, Outfit } from 'next/font/google'
import React from 'react'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-eb-garamond',
  display: 'swap',
})

import { CookieConsent } from '@/components/CookieConsent'
import { VirtualAssistantScript } from '@/components/VirtualAssistantScript'
import { WhatsAppFloatingButton } from '@/components/WhatsAppFloatingButton'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import './globals.css'
import { getFaviconSource } from '@/components/Logo/getLogoSources'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getPublicIntegrationsSettings } from '@/settings/integrations/server'
import { getOptimaCrmSettings } from '@/settings/optimaCrm/server'
import { resolveThemeCustomCSS } from '@/globals/Theme/siteThemeTokens.mjs'
import { resolveThemeFontVars } from '@/globals/Theme/googleFonts'
import { getServerSideURL } from '@/utilities/getURL'
import { isGlobalTrashed } from '@/utilities/isGlobalTrashed'

export const viewport: Viewport = {
  colorScheme: 'light',
}

export async function generateMetadata(): Promise<Metadata> {
  const logoData = await getCachedGlobal('logo', 1)()
  const favicon = getFaviconSource(logoData)

  return {
    metadataBase: new URL(getServerSideURL()),
    icons: {
      icon: [{ url: favicon }],
    },
    openGraph: mergeOpenGraph(),
    twitter: {
      card: 'summary_large_image',
      creator: '@payloadcms',
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getActiveLocale()
  const [optimaCrmSettings, integrationsSettings] = await Promise.all([
    getOptimaCrmSettings(),
    getPublicIntegrationsSettings(),
  ])

  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable, outfit.variable, ebGaramond.variable)}
      lang={locale}
      suppressHydrationWarning
    >
      <body>
        {/* Use precedence so React/Next hoist these into <head> consistently (no manual <head> tag). */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
          precedence="medium"
        />
        <ThemeStyles />
        <Providers
          optimaCrmSettings={optimaCrmSettings}
          integrationsSettings={integrationsSettings}
        >
          <Header />
          {children}
          <Footer />
          <CookieConsent />
          <WhatsAppFloatingButton settings={integrationsSettings.whatsapp} />
          <VirtualAssistantScript settings={integrationsSettings.virtualAssistant} />
        </Providers>
      </body>
    </html>
  )
}

async function ThemeStyles() {
  const payload = await getPayload({ config: configPromise })
  let customCSS: string | null = null
  let fontMode: string | null = null
  let googleFonts: Array<{ family?: string | null; active?: boolean | null }> | null = null

  try {
    const theme = await payload.findGlobal({
      slug: 'theme',
      depth: 0,
    })
    if (!isGlobalTrashed(theme)) {
      customCSS = theme.customCSS ?? null
      fontMode = theme.fontMode ?? null
      googleFonts = theme.googleFonts ?? null
    }
  } catch (error) {
    console.error('Error fetching Theme global:', error)
  }

  // Normalize CRLF so SSR/client style text stays identical.
  const css = resolveThemeCustomCSS(customCSS).replace(/\r\n/g, '\n')
  const resolvedFonts = resolveThemeFontVars({ fontMode, googleFonts })
  const fontCSS = `:root {\n  --font-theme-body: ${resolvedFonts.body};\n  --font-theme-headline: ${resolvedFonts.headline};\n}\n`

  return (
    <>
      {resolvedFonts.stylesheetUrl ? (
        <link href={resolvedFonts.stylesheetUrl} rel="stylesheet" precedence="high" />
      ) : null}
      <style
        href="site-theme"
        precedence="high"
        dangerouslySetInnerHTML={{ __html: `${fontCSS}${css}` }}
      />
    </>
  )
}
