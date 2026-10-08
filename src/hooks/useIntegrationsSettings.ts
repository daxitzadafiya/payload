'use client'

import { getRuntimePublicIntegrationsSettings } from '@/settings/integrations/client'

export function useIntegrationsSettings() {
  return { settings: getRuntimePublicIntegrationsSettings() }
}
