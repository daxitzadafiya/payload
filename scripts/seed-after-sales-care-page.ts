import 'dotenv/config'

import { getPayload } from 'payload'

import { afterSalesCareDefaultContent } from '../src/blocks/AfterSalesCareBlock/defaultContent.js'
import config from '../src/payload.config.js'

const SLUG = 'after-sales-care'

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'pages',
  where: { slug: { equals: SLUG } },
  limit: 1,
  depth: 0,
  locale: 'en',
})

const layout = [
  {
    blockType: 'afterSalesCareBlock' as const,
    ...afterSalesCareDefaultContent,
  },
]

const pageData = {
  title: 'After Sales Care',
  slug: SLUG,
  _status: 'published' as const,
  hero: { type: 'none' as const },
  layout,
  meta: {
    title: 'After Sales Care by Zariko',
    description:
      'After your purchase you can also count on Zariko — maintenance advice, local contacts, legal guidance, and personal support.',
  },
}

if (existing.docs[0]) {
  await payload.update({
    collection: 'pages',
    id: existing.docs[0].id,
    data: pageData,
    locale: 'en',
    context: { disableRevalidate: true },
  })
  payload.logger.info(`Updated page /${SLUG} (id ${existing.docs[0].id})`)
} else {
  const created = await payload.create({
    collection: 'pages',
    data: pageData,
    locale: 'en',
    context: { disableRevalidate: true },
  })
  payload.logger.info(`Created page /${SLUG} (id ${created.id})`)
}

process.exit(0)
