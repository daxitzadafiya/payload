import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { revalidateCachePath, revalidateCacheTag } from '@/utilities/cacheRevalidation'
import type { Page } from '@/payload-types'

import { autoTranslatePageLayout } from './translatePage'

export type DeferredPageAutoTranslateJob = {
  pageId: number | string
  slug: string
  layout: Page['layout']
  previousLayout?: Page['layout'] | null
  isDraft: boolean
  sourceLocale: string
}

async function revalidatePublishedPage(slug: string): Promise<void> {
  const path = slug === 'home' ? '/' : `/${slug}`
  await revalidateCachePath(path)
  await revalidateCacheTag('pages-sitemap')
}

/**
 * Runs after the page save transaction completes so DeepL + locale updates
 * do not hold SQLite locks during the admin save request.
 */
export async function runDeferredPageAutoTranslate(
  job: DeferredPageAutoTranslateJob,
): Promise<void> {
  const payload = await getPayload({ config: configPromise })

  const { updatedLocales } = await autoTranslatePageLayout({
    payload,
    pageId: job.pageId,
    sourceDoc: {
      id: job.pageId,
      layout: job.layout,
    } as Page,
    previousDoc: job.previousLayout ? ({ layout: job.previousLayout } as Page) : null,
    skipChangeCheck: true,
    sourceLocale: job.sourceLocale,
    isDraft: job.isDraft,
  })

  if (updatedLocales.length > 0 && !job.isDraft) {
    await revalidatePublishedPage(job.slug)
  }
}
