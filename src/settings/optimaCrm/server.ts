import { seedOptimaCrmSettings } from '@/settings/optimaCrm/client'
import {
  EMPTY_OPTIMA_CRM_SETTINGS,
  readOptimaCrmEnvConfig,
  resolveOptimaCrmSettingsFromGlobal,
  similarCommercialsQueryClause,
  type ResolvedOptimaCrmSettings,
  type SimilarCommercialsMode,
} from '@/settings/optimaCrm/shared'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function getOptimaCrmSettings(): Promise<ResolvedOptimaCrmSettings> {
  try {
    const getGlobal = getCachedGlobal('optimaCrmSettings', 0)
    const doc = await getGlobal()
    const resolved = resolveOptimaCrmSettingsFromGlobal(doc)
    // Seed sync runtime config so normalize helpers see admin REF field choices on the server.
    seedOptimaCrmSettings(resolved)
    return resolved
  } catch {
    return {
      ...EMPTY_OPTIMA_CRM_SETTINGS,
      ...readOptimaCrmEnvConfig(),
    }
  }
}

export async function getSimilarCommercialsQuery(): Promise<{
  similar_commercials: SimilarCommercialsMode
}> {
  const settings = await getOptimaCrmSettings()
  return similarCommercialsQueryClause(settings)
}

export type {
  PropertyReferenceField,
  ProjectReferenceField,
  ResolvedOptimaCrmSettings,
  SimilarCommercialsMode,
} from '@/settings/optimaCrm/shared'
