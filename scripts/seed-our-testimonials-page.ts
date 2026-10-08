import 'dotenv/config'

import { getPayload } from 'payload'

import { ourTestimonialsDefaultContent } from '../src/blocks/OurTestimonialsBlock/defaultContent.js'
import config from '../src/payload.config.js'

const SLUG = 'our-testimonials'

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
    blockType: 'ourTestimonialsBlock' as const,
    ...ourTestimonialsDefaultContent,
  },
]

const pageData = {
  title: 'Our Testimonials',
  slug: SLUG,
  _status: 'published' as const,
  hero: { type: 'none' as const },
  layout,
  meta: {
    title: 'What our clients say — Zariko',
    description:
      'Read what clients say about buying and selling with Zariko — dedication, transparency, and personal service on every step of the journey.',
  },
}

if (existing.docs[0]) {
  await payload.update({
    collection: 'pages',
    id: existing.docs[0].id,
    data: pageData as unknown as Record<string, unknown>,
    locale: 'en',
    context: { disableRevalidate: true },
  })
  payload.logger.info(`Updated page /${SLUG} (id ${existing.docs[0].id})`)
} else {
  const created = await payload.create({
    collection: 'pages',
    data: pageData as unknown as never,
    locale: 'en',
    context: { disableRevalidate: true },
  })
  payload.logger.info(`Created page /${SLUG} (id ${created.id})`)
}

process.exit(0)
