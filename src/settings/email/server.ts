import { type ResolvedEmailSettings, isEmailConfigured } from '@/settings/email/shared'
import { getCachedGlobal } from '@/utilities/getGlobals'

export async function getEmailSettings(): Promise<ResolvedEmailSettings | null> {
  try {
    const getGlobal = getCachedGlobal('emailSettings', 0)
    const doc = await getGlobal()
    return doc ?? null
  } catch {
    return null
  }
}

export type { ResolvedEmailSettings } from '@/settings/email/shared'
export { isEmailConfigured } from '@/settings/email/shared'
