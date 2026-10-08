'use client'

import React, { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Form, Page } from '@/payload-types'

import { DecorativeVectors } from '@/components/DecorativeVectors'
import { PropertyListView } from '@/components/PropertyList/PropertyListView'
import {
  PropertyListServerDataProvider,
  type PropertyListInitialData,
  type PropertyListServerDataPayload,
} from '@/components/PropertyList/PropertyListServerData'
import type { CRMListingPreset } from '@/utilities/crmProperties'

export type PropertyListBlockClientProps = Extract<
  Page['layout'][0],
  { blockType: 'propertyListBlock' }
> & {
  contactForm?: Form | null
}

type Props = PropertyListBlockClientProps & {
  children: React.ReactNode
  listingKey?: string
}

export const PropertyListBlockClient: React.FC<Props> = ({
  showBreadcrumb,
  breadcrumbParentLabel,
  breadcrumbParentHref,
  pageTitle,
  listingPreset,
  crmCity,
  crmQueryJson,
  pageSize,
  showFilters,
  showMap,
  forceSoldBadge,
  resultsLabel,
  emptyStateNoFavoritesTitle,
  emptyStateNoFavoritesDescription,
  emptyStateNoResultsTitle,
  emptyStateNoResultsDescription,
  listingKey = '',
  contactForm,
  children,
}) => {
  const preset = (listingPreset ?? 'forSale') as CRMListingPreset

  const [initialData, setInitialData] = useState<PropertyListInitialData | null>(null)
  const listingKeyRef = useRef(listingKey)
  listingKeyRef.current = listingKey

  const handleServerData = useCallback((payload: PropertyListServerDataPayload) => {
    if (payload.listingKey !== listingKeyRef.current) return
    setInitialData({ ...payload.data, listingKey: payload.listingKey })
  }, [])

  // City-wise with zero results: hide heading + list (e.g. "Properties for sale in Estepona").
  if (preset === 'cityWise' && initialData && initialData.total === 0) {
    return null
  }

  return (
    <section className="relative overflow-hidden bg-surface-cream pt-24 pb-14 md:pt-28 md:pb-20">
      <DecorativeVectors
        variant="swirl"
        tone="whisper"
        className="pointer-events-none -right-[18%] top-16 h-[48%] w-[42%] opacity-45 max-lg:hidden"
      />
      <DecorativeVectors
        variant="rings"
        className="pointer-events-none -left-20 top-28 h-64 w-64 opacity-50 md:h-80 md:w-80"
      />

      {(showBreadcrumb !== false || pageTitle) && (
        <div className="relative mx-auto mb-10 max-w-max-width px-margin-mobile md:mb-12 md:px-margin-desktop">
          {showBreadcrumb !== false && (
            <nav
              className="mb-5 flex items-center gap-2 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-surface/50"
              aria-label="Breadcrumb"
            >
              <Link
                href={breadcrumbParentHref || '/'}
                className="text-secondary transition-colors hover:text-primary"
              >
                {breadcrumbParentLabel || 'Home'}
              </Link>
              <ChevronRight size={14} className="shrink-0 text-secondary/55" aria-hidden />
              <span className="text-primary/80">{pageTitle || 'Collections'}</span>
            </nav>
          )}
          {pageTitle && (
            <div>
              <span className="mb-4 block h-px w-14 bg-secondary" aria-hidden />
              {showBreadcrumb === false ? (
                <h2 className="m-0 font-headline-lg text-[clamp(2rem,3.8vw,3.25rem)] font-light leading-[1.1] tracking-[0.01em] text-primary">
                  {pageTitle}
                </h2>
              ) : (
                <h1 className="m-0 font-headline-lg text-[clamp(2rem,3.8vw,3.25rem)] font-light leading-[1.1] tracking-[0.01em] text-primary">
                  {pageTitle}
                </h1>
              )}
            </div>
          )}
        </div>
      )}

      <PropertyListServerDataProvider onServerData={handleServerData}>
        <div className="relative">
          <PropertyListView
            listingPreset={preset}
            crmCity={crmCity}
            crmQueryJson={crmQueryJson}
            pageSize={pageSize}
            showFilters={showFilters}
            showMap={showMap}
            forceSoldBadge={forceSoldBadge}
            resultsLabel={resultsLabel}
            emptyStateNoFavoritesTitle={emptyStateNoFavoritesTitle}
            emptyStateNoFavoritesDescription={emptyStateNoFavoritesDescription}
            emptyStateNoResultsTitle={emptyStateNoResultsTitle}
            emptyStateNoResultsDescription={emptyStateNoResultsDescription}
            initialData={initialData}
            listingKey={listingKey}
            serverManaged={preset !== 'favorites'}
            contactForm={contactForm}
          />
          {children}
        </div>
      </PropertyListServerDataProvider>
    </section>
  )
}
