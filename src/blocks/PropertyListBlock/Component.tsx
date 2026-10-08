import React, { Suspense } from 'react'

import {
  PropertyListBlockClient,
  type PropertyListBlockClientProps,
} from '@/blocks/PropertyListBlock/Client'
import { PropertyListBlockData } from '@/blocks/PropertyListBlock/Data'
import {
  parseOrderbyEntriesFromSearchParams,
  parsePropertyListPage,
  parsePropertyListSort,
} from '@/components/PropertyList/propertyListUrl'
import { DEFAULT_PROPERTY_FILTER_OPTIONS } from '@/utilities/propertyFilterOptions.shared'
import { getContactForm } from '@/utilities/getContactForm'

type Props = PropertyListBlockClientProps & {
  searchParams?: Record<string, string | string[] | undefined>
}

const DEFAULT_PAGE_SIZE = 9
const DEFAULT_SORT_OPTIONS = DEFAULT_PROPERTY_FILTER_OPTIONS.sortOptions

export const PropertyListBlock = async ({
  listingPreset,
  crmCity,
  crmQueryJson,
  pageSize,
  searchParams,
  ...rest
}: Props) => {
  const preset = (listingPreset ?? 'forSale') as NonNullable<
    PropertyListBlockClientProps['listingPreset']
  >
  const resolvedPageSize = Math.max(1, pageSize ?? DEFAULT_PAGE_SIZE)
  const listPage = parsePropertyListPage(searchParams)
  const defaultSort = DEFAULT_SORT_OPTIONS[0]?.value ?? 'recent'
  const listSort = parsePropertyListSort(searchParams, defaultSort, DEFAULT_SORT_OPTIONS)
  const orderbyEntries = parseOrderbyEntriesFromSearchParams(searchParams)
  const suspenseKey = `${preset}-${crmCity ?? ''}-${crmQueryJson ?? ''}-${resolvedPageSize}-${listPage}-${orderbyEntries.join('|') || listSort || 'default'}`
  const contactForm = await getContactForm()

  return (
    <PropertyListBlockClient
      {...rest}
      listingPreset={preset}
      crmCity={crmCity}
      crmQueryJson={crmQueryJson}
      pageSize={pageSize}
      listingKey={suspenseKey}
      contactForm={contactForm}
    >
      <Suspense key={suspenseKey} fallback={null}>
        <PropertyListBlockData
          preset={preset}
          crmCity={crmCity}
          crmQueryJson={crmQueryJson}
          resolvedPageSize={resolvedPageSize}
          page={listPage}
          sortValue={listSort || null}
          orderbyEntries={orderbyEntries}
          listingKey={suspenseKey}
        />
      </Suspense>
    </PropertyListBlockClient>
  )
}
