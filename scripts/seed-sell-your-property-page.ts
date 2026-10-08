import 'dotenv/config'

import { getPayload } from 'payload'

import { sellYourPropertyDefaultContent } from '../src/blocks/SellYourPropertyBlock/defaultContent.js'
import config from '../src/payload.config.js'

const SLUG = 'sell-your-property'

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
    blockType: 'sellYourPropertyBlock' as const,
    ...sellYourPropertyDefaultContent,
  },
]

const pageData = {
  title: 'Sell your property',
  slug: SLUG,
  _status: 'published' as const,
  hero: { type: 'none' as const },
  layout,
  meta: {
    title: 'Sell your property with Zariko',
    description:
      'Sell your home on the Costa del Sol with Zariko — targeted sales plans, professional marketing, and trusted local experts.',
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
