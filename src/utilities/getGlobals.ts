import type { Config } from '@/payload-types'

import configPromise from '@payload-config'
import { type DataFromGlobalSlug, getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import type { Locale } from '@/i18n/config'
import { isGlobalTrashed } from '@/utilities/isGlobalTrashed'

type Global = keyof Config['globals']

async function getGlobal<T extends Global>(
  slug: T,
  depth = 0,
  locale?: Locale,
): Promise<DataFromGlobalSlug<T>> {
  const payload = await getPayload({ config: configPromise })

  const global = await payload.findGlobal({
    slug,
    depth,
    locale,
  })

  // Soft-trashed globals are hidden from the public site; keep a typed shell.
  if (isGlobalTrashed(global)) {
    return {
      id: (global as { id?: number | string }).id,
      trashedAt: (global as { trashedAt?: string | null }).trashedAt,
    } as unknown as DataFromGlobalSlug<T>
  }

  return global
}

/**
 * Returns a unstable_cache function mapped with the cache tag for the slug
 */
export const getCachedGlobal = <T extends Global>(slug: T, depth = 0, locale?: Locale) => {
  const localeKey = locale ?? 'default'

  return unstable_cache(async () => getGlobal<T>(slug, depth, locale), [slug, localeKey, String(depth)], {
    tags: [`global_${slug}`, `global_${slug}_${localeKey}`],
  })
}
