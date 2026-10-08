import {
  EMPTY_INTEGRATIONS_SETTINGS,
  toPublicIntegrationsSettings,
  type PublicIntegrationsSettings,
} from '@/settings/integrations/shared'

let runtimeSettings: PublicIntegrationsSettings | null = null

export function invalidateIntegrationsSettingsCache(): void {
  runtimeSettings = null
}

export function seedIntegrationsSettings(settings: PublicIntegrationsSettings): void {
  runtimeSettings = settings
}

export function getRuntimePublicIntegrationsSettings(): PublicIntegrationsSettings {
  return runtimeSettings ?? toPublicIntegrationsSettings(EMPTY_INTEGRATIONS_SETTINGS)
}

export type { PublicIntegrationsSettings } from '@/settings/integrations/shared'
