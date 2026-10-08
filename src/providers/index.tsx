import React from 'react'

import type { PublicIntegrationsSettings } from '@/settings/integrations/shared'
import type { ResolvedOptimaCrmSettings } from '@/settings/optimaCrm/shared'

import { AppSettingsInitializer } from './AppSettings'
import { HeroOverlayProvider } from './HeroOverlay'
import { PropertyFavoritesProvider } from './PropertyFavorites'

export const Providers: React.FC<{
  children: React.ReactNode
  optimaCrmSettings: ResolvedOptimaCrmSettings
  integrationsSettings: PublicIntegrationsSettings
}> = ({ children, optimaCrmSettings, integrationsSettings }) => {
  return (
    <PropertyFavoritesProvider>
      <HeroOverlayProvider>
        <AppSettingsInitializer
          optimaCrmSettings={optimaCrmSettings}
          integrationsSettings={integrationsSettings}
        />
        {children}
      </HeroOverlayProvider>
    </PropertyFavoritesProvider>
  )
}
