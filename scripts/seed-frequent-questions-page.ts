import 'dotenv/config'

import { getPayload } from 'payload'

import { frequentQuestionsDefaultContent } from '../src/blocks/FrequentQuestionsBlock/defaultContent.js'
import config from '../src/payload.config.js'

const SLUG = 'frequent-questions'

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
    blockType: 'frequentQuestionsBlock' as const,
    ...frequentQuestionsDefaultContent,
  },
]

const pageData = {
  title: 'Frequent questions',
  slug: SLUG,
  _status: 'published' as const,
  hero: { type: 'none' as const },
  layout,
  meta: {
    title: 'Frequent questions',
    description:
      'Answers to common questions about buying property in Spain — costs, documents, mortgages, and more.',
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
