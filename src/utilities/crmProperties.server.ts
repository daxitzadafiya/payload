/**
 * Server-only property listing fetch through the MODE-selected NestJS base.
 */
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

import { getFromCRM, postToCRM } from '@/utilities/crmApi.server'
import { slimCRMListProperties } from '@/utilities/crmListPropertySlim'
import { crmListingBodyToSearchParams } from '@/utilities/crmPropertiesGetParams'
import {
  extractCRMList,
  extractCRMTotal,
  shouldUseCRMPropertiesPost,
  withCRMPostListingOptions,
  type CRMFetchResult,
  type CRMListingPreset,
  type PropertyListFilters,
} from '@/utilities/crmProperties'

const CRM_LIST_REVALIDATE_SECONDS = 120

async function fetchCRMPropertiesServerLive(
  searchParams: URLSearchParams,
): Promise<CRMFetchResult> {
  let response = await getFromCRM('properties', searchParams)
  if (!response.ok) {
    throw new Error(`CRM API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const list = slimCRMListProperties(extractCRMList(data))
  const total = extractCRMTotal(data, list.length)

  console.info('[CRM properties GET]', {
    query: searchParams.toString(),
    count: list.length,
    total,
    references: list
      .slice(0, 5)
      .map((item) => item.reference)
      .filter(Boolean),
  })

  return { properties: list, total }
}

async function fetchCRMPropertiesServerPostLive(
  body: Record<string, unknown>,
): Promise<CRMFetchResult> {
  const postBody = withCRMPostListingOptions(body)
  const response = await postToCRM('commercial_properties', postBody)
  if (!response.ok) {
    throw new Error(`CRM commercial_properties API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const list = slimCRMListProperties(extractCRMList(data))
  const total = extractCRMTotal(data, list.length)

  console.log('----[CRM commercial_properties POST]----')

  console.dir(
    {
      options: postBody.options,
      query: postBody.query,
    },
    { depth: null, colors: true },
  )
  console.log('COUNT: ', list.length)
  console.log('TOTAL: ', total)
  console.log('------------------------------------')

  return { properties: list, total }
}

const getCachedCRMPropertiesList = unstable_cache(
  async (queryKey: string) => fetchCRMPropertiesServerLive(new URLSearchParams(queryKey)),
  ['crm-properties-list-v3'],
  {
    revalidate: CRM_LIST_REVALIDATE_SECONDS,
    tags: ['crm-properties-list'],
  },
)

const getCachedCRMPropertiesListPost = unstable_cache(
  async (bodyKey: string) =>
    fetchCRMPropertiesServerPostLive(JSON.parse(bodyKey) as Record<string, unknown>),
  ['crm-commercial-properties-list-v3'],
  {
    revalidate: CRM_LIST_REVALIDATE_SECONDS,
    tags: ['crm-properties-list'],
  },
)

export const fetchCRMPropertiesServer = cache(
  async (
    body: Record<string, unknown>,
    options?: {
      preset?: CRMListingPreset
      filters?: PropertyListFilters
      favoriteIds?: (string | number)[]
    },
  ): Promise<CRMFetchResult> => {
    const usePost = shouldUseCRMPropertiesPost({
      filters: options?.filters,
      preset: options?.preset,
      favoriteIds: options?.favoriteIds,
    })

    if (usePost) {
      return getCachedCRMPropertiesListPost(JSON.stringify(body))
    }

    const searchParams = crmListingBodyToSearchParams(body)
    const queryKey = searchParams.toString()
    return getCachedCRMPropertiesList(queryKey)
  },
)
