import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import type { Locale } from '@/i18n/config'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { LivePreviewListener } from '@/components/LivePreviewListener'

function slugFromParams(slugParam: string | string[] | undefined): string {
  if (!slugParam) return 'home'
  const parts = Array.isArray(slugParam) ? slugParam : [slugParam]
  return parts.map((part) => decodeURIComponent(part)).filter(Boolean).join('/') || 'home'
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return (pages.docs || [])
    .filter((doc) => doc.slug && doc.slug !== 'home')
    .map(({ slug }) => ({
      slug: String(slug)
        .split('/')
        .map((part) => part.trim())
        .filter(Boolean),
    }))
    .filter((entry) => entry.slug.length > 0)
}

type Args = {
  params: Promise<{
    slug?: string[]
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Page({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { isEnabled: draft } = await draftMode()
  const [{ locale }, params, searchParams] = await Promise.all([
    getActiveLocale(),
    paramsPromise,
    searchParamsPromise,
  ])
  const decodedSlug = slugFromParams(params.slug)
  const url = '/' + decodedSlug
  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPageBySlug({
    slug: decodedSlug,
    locale,
  })

  // Remove this code once your website is seeded
  if (!page && decodedSlug === 'home') {
    page = homeStatic
  }

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page

  return (
    <article className="">
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} searchParams={searchParams} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale } = await getActiveLocale()
  const params = await paramsPromise
  const decodedSlug = slugFromParams(params.slug)
  const page = await queryPageBySlug({
    slug: decodedSlug,
    locale,
  })

  return generateMeta({ doc: page })
}

const queryPageBySlug = cache(async ({ slug, locale }: { slug: string; locale: Locale }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    locale,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
