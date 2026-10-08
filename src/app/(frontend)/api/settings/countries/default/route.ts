import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import { revalidateCacheTag } from '@/utilities/cacheRevalidation'
import { localeCodes } from '@/i18n/locales'

type Body = {
  countryId?: number | string | null
}

async function revalidateCountries(payload: Awaited<ReturnType<typeof getPayload>>) {
  payload.logger.info('Revalidating countries')
  await revalidateCacheTag('collection_countries')
  for (const locale of localeCodes) {
    await revalidateCacheTag(`collection_countries_${locale}`)
  }
}

/**
 * Set the single Sale hero default country (must already be enabled for Sale),
 * or clear the default when countryId is null.
 */
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const headers = await getHeaders()
    const { user } = await payload.auth({ headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as Body
    const rawId = body.countryId
    const countryId =
      rawId === null || rawId === undefined || rawId === ''
        ? null
        : typeof rawId === 'number'
          ? rawId
          : Number(rawId)

    if (countryId !== null && !Number.isFinite(countryId)) {
      return NextResponse.json({ error: 'Invalid countryId' }, { status: 400 })
    }

    const existingDefaults = await payload.find({
      collection: 'countries',
      depth: 0,
      limit: 100,
      pagination: false,
      where: { isDefault: { equals: true } },
    })

    if (countryId === null) {
      for (const doc of existingDefaults.docs) {
        await payload.update({
          collection: 'countries',
          id: doc.id,
          data: { isDefault: false },
          depth: 0,
          context: {
            disableRevalidate: true,
            skipDefaultCountryClear: true,
          },
        })
      }

      await revalidateCountries(payload)
      return NextResponse.json({ defaultCountryId: null })
    }

    const country = await payload.findByID({
      collection: 'countries',
      id: countryId,
      depth: 0,
    })

    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 })
    }

    if (country.offerSale !== true) {
      return NextResponse.json(
        { error: 'Only countries enabled for Sale can be the default' },
        { status: 400 },
      )
    }

    for (const doc of existingDefaults.docs) {
      if (doc.id === countryId) continue
      await payload.update({
        collection: 'countries',
        id: doc.id,
        data: { isDefault: false },
        depth: 0,
        context: {
          disableRevalidate: true,
          skipDefaultCountryClear: true,
        },
      })
    }

    if (country.isDefault !== true) {
      await payload.update({
        collection: 'countries',
        id: countryId,
        data: { isDefault: true },
        depth: 0,
        context: {
          disableRevalidate: true,
          skipDefaultCountryClear: true,
        },
      })
    }

    await revalidateCountries(payload)
    return NextResponse.json({ defaultCountryId: countryId })
  } catch (error) {
    console.error('Set default country error:', error)
    const message = error instanceof Error ? error.message : 'Failed to set default country'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
