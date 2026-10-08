/**
 * Server-only CRM constructions / projects via Yii contact URL.
 */
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

import { getFromCRMContactWithQueryUsingUserKey } from '@/utilities/crmApi.server'
import { slimCRMListProperties } from '@/utilities/crmListPropertySlim'
import { extractCRMList, extractCRMTotal, type CRMFetchResult } from '@/utilities/crmProperties'
import {
  buildCRMProjectsSearchParams,
  mapConstructionToPropertyRecord,
  type ProjectListFilters,
} from '@/utilities/crmProjects'

const CRM_LIST_REVALIDATE_SECONDS = 120

async function fetchCRMProjectsServerLive(
  queryKey: string,
  locale: string,
): Promise<CRMFetchResult> {
  const searchParams = new URLSearchParams(queryKey)
  const response = await getFromCRMContactWithQueryUsingUserKey('constructions', searchParams)
  if (!response.ok) {
    throw new Error(`CRM constructions API failed (${response.status})`)
  }

  const data = (await response.json()) as unknown
  const list = slimCRMListProperties(
    extractCRMList(data).map((row) => mapConstructionToPropertyRecord(row, locale)),
  )
  const total = extractCRMTotal(data, list.length)

  console.info('[CRM constructions Yii GET]', {
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

const getCachedCRMProjectsList = unstable_cache(
  async (queryKey: string, locale: string) => fetchCRMProjectsServerLive(queryKey, locale),
  ['crm-constructions-yii-v1'],
  {
    revalidate: CRM_LIST_REVALIDATE_SECONDS,
    tags: ['crm-projects-list'],
  },
)

export const fetchCRMProjectsServer = cache(
  async (
    input:
      | Record<string, unknown>
      | {
          page: number
          pageSize: number
          filters?: ProjectListFilters
          sortParams?: Record<string, unknown>
        },
    options?: { locale?: string },
  ): Promise<CRMFetchResult> => {
    const locale = options?.locale ?? 'en'

    let searchParams: URLSearchParams
    if (
      input &&
      typeof input === 'object' &&
      '_yiiSearchParams' in input &&
      typeof (input as { _yiiSearchParams?: unknown })._yiiSearchParams === 'string'
    ) {
      searchParams = new URLSearchParams(
        (input as { _yiiSearchParams: string })._yiiSearchParams,
      )
    } else if (
      input &&
      typeof input === 'object' &&
      'page' in input &&
      'pageSize' in input &&
      typeof (input as { page: unknown }).page === 'number'
    ) {
      const opts = input as {
        page: number
        pageSize: number
        filters?: ProjectListFilters
        sortParams?: Record<string, unknown>
      }
      searchParams = buildCRMProjectsSearchParams(opts)
    } else {
      // Legacy body from buildCRMProjectsQuery
      const body = input as Record<string, unknown>
      const optionsObj =
        body.options && typeof body.options === 'object'
          ? (body.options as Record<string, unknown>)
          : {}
      searchParams = buildCRMProjectsSearchParams({
        page: Number(optionsObj.page) || 1,
        pageSize: Number(optionsObj.limit ?? optionsObj.page_size) || 11,
        sortParams:
          optionsObj.sort && typeof optionsObj.sort === 'object'
            ? (optionsObj.sort as Record<string, unknown>)
            : undefined,
      })
    }

    return getCachedCRMProjectsList(searchParams.toString(), locale)
  },
)
