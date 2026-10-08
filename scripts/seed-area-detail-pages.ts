import 'dotenv/config'

import { getPayload } from 'payload'

import {
  esteponaAreaDetailContent,
  marbellaAreaDetailContent,
} from '../src/blocks/AreaDetailBlock/defaultContent.js'
import config from '../src/payload.config.js'

type AreaSeed = {
  /** Public URL path / CMS slug, e.g. area-info/estepona */
  slug: string
  /** Legacy short slug used by the first seed — migrated to nested slug */
  legacySlug: string
  title: string
  metaTitle: string
  metaDescription: string
  detail: typeof esteponaAreaDetailContent
  propertiesTitle: string
}

const areas: AreaSeed[] = [
  {
    slug: 'area-info/estepona',
    legacySlug: 'estepona',
    title: 'Estepona',
    metaTitle: 'Estepona — Authentic living on the Costa del Sol',
    metaDescription:
      'Discover Estepona with Zariko — authentic Andalusian charm, marina living, and properties for sale on the Costa del Sol.',
    detail: esteponaAreaDetailContent,
    propertiesTitle: 'Properties for sale in Estepona',
  },
  {
    slug: 'area-info/marbella',
    legacySlug: 'marbella',
    title: 'Marbella',
    metaTitle: 'Marbella — Luxury living on the Costa del Sol',
    metaDescription:
      'Discover Marbella with Zariko — luxury living, Golden Mile neighbourhoods, and properties for sale on the Costa del Sol.',
    detail: marbellaAreaDetailContent,
    propertiesTitle: 'Properties for sale in Marbella',
  },
]

const payload = await getPayload({ config })

for (const area of areas) {
  const existing = await payload.find({
    collection: 'pages',
    where: {
      or: [{ slug: { equals: area.slug } }, { slug: { equals: area.legacySlug } }],
    },
    limit: 1,
    depth: 0,
    locale: 'en',
  })

  const layout = [
    {
      blockType: 'areaDetailBlock' as const,
      ...area.detail,
    },
    {
      blockType: 'propertyListBlock' as const,
      showBreadcrumb: false,
      pageTitle: area.propertiesTitle,
      resultsLabel: 'properties',
      listingPreset: 'forSale' as const,
      pageSize: 6,
      showFilters: false,
      showMap: false,
    },
  ]

  const pageData = {
    title: area.title,
    slug: area.slug,
    _status: 'published' as const,
    hero: { type: 'none' as const },
    layout,
    meta: {
      title: area.metaTitle,
      description: area.metaDescription,
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
    payload.logger.info(`Updated page /${area.slug} (id ${existing.docs[0].id})`)
  } else {
    const created = await payload.create({
      collection: 'pages',
      data: pageData as unknown as never,
      locale: 'en',
      context: { disableRevalidate: true, skipAutoTranslate: true },
    })
    payload.logger.info(`Created page /${area.slug} (id ${created.id})`)
  }
}

process.exit(0)
