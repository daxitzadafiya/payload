import 'dotenv/config'

import { getPayload } from 'payload'

import { areaInfoDefaultContent } from '../src/blocks/AreaInfoBlock/defaultContent.js'
import config from '../src/payload.config.js'

const SLUG = 'area-info'

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'pages',
  where: { slug: { equals: SLUG } },
  limit: 1,
  depth: 0,
  locale: 'en',
})

const existingBlock = existing.docs[0]?.layout?.find(
  (block) => block && typeof block === 'object' && block.blockType === 'areaInfoBlock',
) as
  | {
      cards?: { image?: number | { id: number } | null; title?: string | null }[] | null
    }
  | undefined

const cards = areaInfoDefaultContent.cards.map((card, index) => {
  const previous = existingBlock?.cards?.[index]
  const image =
    typeof previous?.image === 'object' && previous.image && 'id' in previous.image
      ? previous.image.id
      : typeof previous?.image === 'number'
        ? previous.image
        : undefined

  return {
    ...card,
    ...(image != null ? { image } : {}),
  }
})

const layout = [
  {
    blockType: 'areaInfoBlock' as const,
    ...areaInfoDefaultContent,
    cards,
  },
]

const pageData = {
  title: 'Areas',
  slug: SLUG,
  _status: 'published' as const,
  hero: { type: 'none' as const },
  layout,
  meta: {
    title: 'Areas — Popular residential areas on the Costa del Sol',
    description:
      'Discover popular residential areas on the Costa del Sol with Zariko — from Marbella and Estepona to Fuengirola, Mijas Costa, and more.',
  },
}

if (existing.docs[0]) {
  await payload.update({
    collection: 'pages',
    id: existing.docs[0].id,
    data: pageData as unknown as Record<string, unknown>,
    locale: 'en',
    context: { disableRevalidate: true, skipAutoTranslate: true },
  })
  payload.logger.info(`Updated page /${SLUG} (id ${existing.docs[0].id})`)
} else {
  const created = await payload.create({
    collection: 'pages',
    data: pageData as unknown as never,
    locale: 'en',
    context: { disableRevalidate: true, skipAutoTranslate: true },
  })
  payload.logger.info(`Created page /${SLUG} (id ${created.id})`)
}

process.exit(0)
