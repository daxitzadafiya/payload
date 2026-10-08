import type { Payload } from 'payload'

import {
  EMPTY_DEEPL_SETTINGS,
  resolveDeepLSettingsFromGlobal,
  type ResolvedDeepLSettings,
} from '@/settings/deepl/shared'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function getDeepLSettingsFromPayload(
  payload: Payload,
): Promise<ResolvedDeepLSettings> {
  try {
    const doc = await payload.findGlobal({
      slug: 'deeplSettings',
      depth: 0,
      overrideAccess: true,
    })
    return resolveDeepLSettingsFromGlobal(doc)
  } catch {
    return EMPTY_DEEPL_SETTINGS
  }
}

export async function getDeepLSettings(): Promise<ResolvedDeepLSettings> {
  try {
    const getGlobal = getCachedGlobal('deeplSettings', 0)
    const doc = await getGlobal()
    return resolveDeepLSettingsFromGlobal(doc)
  } catch {
    return EMPTY_DEEPL_SETTINGS
  }
}

export type { ResolvedDeepLSettings } from '@/settings/deepl/shared'
