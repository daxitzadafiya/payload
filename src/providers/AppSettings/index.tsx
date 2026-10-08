'use client'

import React from 'react'

import {
  seedIntegrationsSettings,
  type PublicIntegrationsSettings,
} from '@/settings/integrations/client'
import { seedOptimaCrmSettings, type ResolvedOptimaCrmSettings } from '@/settings/optimaCrm/client'

export const AppSettingsInitializer: React.FC<{
  optimaCrmSettings: ResolvedOptimaCrmSettings
  integrationsSettings: PublicIntegrationsSettings
}> = ({ optimaCrmSettings, integrationsSettings }) => {
  seedOptimaCrmSettings(optimaCrmSettings)
  seedIntegrationsSettings(integrationsSettings)
  return null
}
