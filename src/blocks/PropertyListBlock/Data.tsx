import React from 'react'

import {
  PropertyListServerDataSync,
  type PropertyListInitialData,
} from '@/components/PropertyList/PropertyListServerData'
import { extractImageOrigin } from '@/components/PropertyList/propertyListImagePreload'
import { getLocale } from '@/i18n/getLocale'
import { DEFAULT_PROPERTY_FILTER_OPTIONS } from '@/utilities/propertyFilterOptions.shared'
import type { CRMListingPreset } from '@/utilities/crmProperties'
import { fetchPropertyListServerData } from '@/utilities/propertyListServer'

type Props = {
  preset: CRMListingPreset
  crmCity?: number | null
  crmQueryJson?: string | null
  resolvedPageSize: number
  page: number
  sortValue?: string | null
  orderbyEntries?: string[]
  listingKey: string
}

export async function PropertyListBlockData({
  preset,
  crmCity,
  crmQueryJson,
  resolvedPageSize,
  page,
  sortValue,
  orderbyEntries = [],
  listingKey,
}: Props) {
  const defaultSort = DEFAULT_PROPERTY_FILTER_OPTIONS.sortOptions[0]?.value ?? 'recent'
  let initialData: PropertyListInitialData = {
    page,
    properties: [],
    total: 0,
    sort: sortValue?.trim() || defaultSort,
    preloadImageUrls: [],
  }

  if (preset !== 'favorites') {
    try {
      const locale = await getLocale()
      const fetched = await fetchPropertyListServerData({
        preset,
        crmCity,
        crmQueryJson,
        pageSize: resolvedPageSize,
        page,
        sortValue,
        orderbyEntries,
        locale,
      })
      if (fetched) initialData = fetched
    } catch (error) {
      console.error(`Failed to prefetch property list (${preset})`, error)
    }
  }

  const imageOrigin = initialData.preloadImageUrls?.[0]
    ? extractImageOrigin(initialData.preloadImageUrls[0])
    : null

  return (
    <>
      {imageOrigin && <link rel="preconnect" href={imageOrigin} crossOrigin="anonymous" />}
      {initialData.preloadImageUrls?.map((url) => (
        <link key={url} rel="preload" as="image" href={url} />
      ))}
      <PropertyListServerDataSync listingKey={listingKey} initialData={initialData} />
    </>
  )
}
