import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { getActiveLocale } from '@/i18n/getLanguageMenu'
import type { OwnersBlock, Page } from '@/payload-types'

import type { OwnerFormSettings } from './ownerFormSettings'

function toOwnerFormSettings(block: OwnersBlock): OwnerFormSettings | null {
  if (typeof block.form !== 'object' || block.form === null) return null

  return {
    form: block.form as unknown as OwnerFormSettings['form'],
    enableResubmit: block.enableResubmit,
    resubmitButtonLabel: block.resubmitButtonLabel,
    submitLabelOverride: block.submitLabelOverride,
    successTitle: block.successTitle,
    successSubtitle: block.successSubtitle,
    trustNote: block.formTrustNote,
  }
}

function findOwnersBlock(page: Page | undefined): OwnerFormSettings | null {
  const block = page?.layout?.find((item) => item.blockType === 'ownersBlock')
  if (!block || block.blockType !== 'ownersBlock') return null
  return toOwnerFormSettings(block)
}

/**
 * Reuses the owner form already configured on the site (homepage first).
 * Sell and rent pages open that same form.
 */
export const getOwnerFormSettings = cache(async (): Promise<OwnerFormSettings | null> => {
  const payload = await getPayload({ config: configPromise })
  const { locale } = await getActiveLocale()

  const sharedQuery = {
    collection: 'pages' as const,
    depth: 2,
    draft: false,
    locale,
    overrideAccess: false,
    pagination: false as const,
  }

  const home = await payload.find({
    ...sharedQuery,
    limit: 1,
    where: { slug: { equals: 'home' } },
  })

  const fromHome = findOwnersBlock(home.docs[0])
  if (fromHome) return fromHome

  const pages = await payload.find({
    ...sharedQuery,
    limit: 100,
  })

  for (const page of pages.docs) {
    const settings = findOwnersBlock(page)
    if (settings) return settings
  }

  return null
})
