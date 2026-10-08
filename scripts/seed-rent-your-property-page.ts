import 'dotenv/config'

import { getPayload } from 'payload'

import { rentYourPropertyDefaultContent } from '../src/blocks/SellYourPropertyBlock/rentDefaultContent.js'
import { enqueueAutoTranslate } from '../src/utilities/autoTranslate/autoTranslateQueue.js'
import config from '../src/payload.config.js'

const SLUG = 'rent-your-property'

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'pages',
  where: { slug: { equals: SLUG } },
  limit: 1,
  depth: 0,
  locale: 'en',
})

if (existing.docs[0]) {
  payload.logger.info(`Page /${SLUG} already exists (id ${existing.docs[0].id}); left unchanged`)
  process.exit(0)
}

const created = await payload.create({
  collection: 'pages',
  locale: 'en',
  context: { disableRevalidate: true },
  data: {
    title: 'Rent your property',
    slug: SLUG,
    _status: 'published',
    hero: { type: 'none' },
    layout: [
      {
        blockType: 'sellYourPropertyBlock',
        ...rentYourPropertyDefaultContent,
      },
    ],
    meta: {
      title: 'Rent your property with Zariko',
      description:
        'Rent out your home on the Costa del Sol with Zariko — a clear rental plan, professional marketing, and trusted local experts.',
    },
  },
})

payload.logger.info(`Created page /${SLUG} (id ${created.id})`)

// Page translation is scheduled after the save. Wait until that job finishes.
await new Promise((resolve) => setTimeout(resolve, 0))
await enqueueAutoTranslate(async () => undefined)

process.exit(0)
