import {
  EMPTY_INTEGRATIONS_SETTINGS,
  resolveIntegrationsSettingsFromGlobal,
  toPublicIntegrationsSettings,
  type PublicIntegrationsSettings,
  type ResolvedIntegrationsSettings,
} from '@/settings/integrations/shared'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function getIntegrationsSettings(): Promise<ResolvedIntegrationsSettings> {
  try {
    const getGlobal = getCachedGlobal('integrationsSettings', 0)
    const doc = await getGlobal()
    return resolveIntegrationsSettingsFromGlobal(doc)
  } catch {
    return EMPTY_INTEGRATIONS_SETTINGS
  }
}

export async function getPublicIntegrationsSettings(): Promise<PublicIntegrationsSettings> {
  const settings = await getIntegrationsSettings()
  return toPublicIntegrationsSettings(settings)
}

export type { ResolvedIntegrationsSettings } from '@/settings/integrations/shared'
