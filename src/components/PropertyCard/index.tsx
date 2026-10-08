'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Bath, Bed, Ruler, Star } from 'lucide-react'
import type { Media as PayloadMedia } from '@/payload-types'

import { PropertyCardImageGallery } from '@/components/PropertyCard/PropertyCardImageGallery'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import type { FavoritePropertyId } from '@/utilities/propertyFavorites'
import { stashPropertyDetailFetchStatus } from '@/utilities/propertyDetailFetchStatus'
import {
  stashPropertyDetailListingContext,
  type PropertyDetailListingContext,
} from '@/utilities/propertyDetailListingContext'
import { useLocalizedPropertyPrice, useTranslation } from '@/utilities/translateClient'
import { getShownReference } from '@/settings/optimaCrm/shared'
import { formatTitle } from '@/utilities/formateTitle'

export type PropertyCardData = {
  imageResource?: PayloadMedia
  imageUrl?: string
  /** Multiple CRM images for in-card slider */
  imageUrls?: string[]
  location: string
  city?: string
  reference?: string
  /** Admin-selected REF for display; falls back to reference. */
  displayReference?: string
  title: string
  beds?: number
  baths?: number
  sqft?: number | string
  price: string
  /** Secondary price line (e.g. holiday total summary) */
  priceSubtext?: string
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
}

type Props = {
  property: PropertyCardData
  /** CRM property id — enables favorite toggle when set */
  propertyId?: FavoritePropertyId | null
  /** When set, card navigates to property detail page */
  href?: string
  /**
   * Same logic as Properties block carousel:
   * - CRM: pass `property.statusBadgeLabel` (SOLD / RESERVED from API status)
   * - Sold page / CMS override: pass `'SOLD'` via `forceSoldBadge` or `showSoldBadge`
   */
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
  variant?: 'surface' | 'surface-container-low'
  className?: string
  style?: React.CSSProperties
  /** Passed to view-by-ref on the detail page (via sessionStorage), not the browser URL. */
  detailFetchStatuses?: string[]
  /** Passed to detail page via sessionStorage (kept out of URL). */
  detailListingContext?: PropertyDetailListingContext
  /** When set (e.g. Properties block), pauses parent carousel auto-play while engaging this card */
  onCardEngage?: () => void
  onCardRelease?: () => void
}

/** Display property area as a whole number (e.g. 90.6m² → 90m²). */
export function formatPropertyAreaDisplay(sqft?: number | string): string {
  if (sqft === undefined || sqft === null || sqft === '') return '0'

  const toInteger = (value: number) => `${Math.floor(value).toLocaleString('en-US')}`

  if (typeof sqft === 'number') {
    if (!Number.isFinite(sqft) || sqft <= 0) return '0'
    return `${toInteger(sqft)}m²`
  }

  const raw = String(sqft).trim()
  const match = raw.match(/^([\d.,]+)\s*(m²|m2|ft²|ft2)?$/i)

  if (match) {
    const value = parseFloat(match[1].replace(/,/g, ''))
    if (!Number.isFinite(value) || value <= 0) return '0'

    const unitToken = match[2]?.toLowerCase()
    const unit = unitToken?.startsWith('ft') ? 'ft²' : 'm²'
    return `${toInteger(value)}${unit}`
  }

  return raw
}

/** Matches Properties block: `showSoldBadge` on CMS or `forceSoldBadge` on list sold page. */
export function resolvePropertyCardStatusBadge({
  statusBadgeLabel,
  forceSoldBadge,
  showSoldBadge,
  useCrmStatus = true,
}: {
  statusBadgeLabel?: 'SOLD' | 'RESERVED'
  forceSoldBadge?: boolean
  showSoldBadge?: boolean
  /** When false (CMS manual cards), only `showSoldBadge` applies. */
  useCrmStatus?: boolean
}): 'SOLD' | 'RESERVED' | undefined {
  if (forceSoldBadge || showSoldBadge) return 'SOLD'
  if (useCrmStatus) return statusBadgeLabel
  return undefined
}

export const PropertyCard: React.FC<Props> = ({
  property,
  propertyId,
  href,
  statusBadgeLabel,
  detailFetchStatuses,
  detailListingContext,
  variant = 'surface',
  className = '',
  style,
  onCardEngage,
  onCardRelease,
}) => {
  const { isFavorite, toggleFavorite } = usePropertyFavorites()
  const favorited = propertyId != null && propertyId !== '' && isFavorite(propertyId)
  const viewPropertyLabel = useTranslation('propertyList.filters.viewProperty', 'View Property')
  const refPrefixLabel = useTranslation('propertyList.card.refPrefix', 'Ref:')
  const soldBadgeLabel = useTranslation('propertyList.card.sold', 'Sold')
  const reservedBadgeLabel = useTranslation('propertyList.card.reserved', 'Reserved')
  const addToFavoritesLabel = useTranslation('propertyList.card.addToFavorites', 'Add to favorites')
  const removeFromFavoritesLabel = useTranslation(
    'propertyList.card.removeFromFavorites',
    'Remove from favorites',
  )
  const displayPrice = useLocalizedPropertyPrice(property.price)
  const displayPriceSubtext = useLocalizedPropertyPrice(property.priceSubtext)
  const shownReference = getShownReference(property)
  const statusBadgeDisplay =
    statusBadgeLabel === 'SOLD'
      ? soldBadgeLabel
      : statusBadgeLabel === 'RESERVED'
        ? reservedBadgeLabel
        : undefined
  const handleFavoritePointer = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    handleFavoritePointer(event)
    if (propertyId == null || propertyId === '') return
    toggleFavorite(propertyId)
  }

  const cardBase =
    variant === 'surface-container-low'
      ? 'flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-secondary/25 bg-surface-cream shadow-[0_22px_48px_-28px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-[0_28px_56px_-28px_rgba(0,0,0,0.28)] md:rounded-[1.75rem]'
      : 'flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-secondary/25 bg-surface-cream shadow-[0_22px_48px_-28px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-[0_28px_56px_-28px_rgba(0,0,0,0.28)] md:rounded-[1.75rem]'

  const imageWrapperClass =
    variant === 'surface-container-low'
      ? 'relative h-[230px] shrink-0 overflow-hidden md:h-[260px]'
      : 'relative h-[230px] shrink-0 overflow-hidden after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-24 after:bg-gradient-to-t after:from-primary/40 after:to-transparent sm:h-[250px] md:h-[280px]'

  const cardInfoClass = 'flex h-full flex-1 flex-col p-4 md:p-5'

  const chipClassName =
    'inline-flex items-center gap-1 rounded-md border border-secondary/20 bg-surface-sand/80 px-2.5 py-1 font-label-sm text-[11px] text-on-surface/70'

  const viewButtonClassName =
    'mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md border border-secondary bg-secondary py-3 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_28px_-16px_color-mix(in_srgb,var(--color-secondary)_65%,transparent)] transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary'

  const viewButton = href ? (
    <span className={viewButtonClassName}>
      {viewPropertyLabel}
      <ArrowRight
        size={14}
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </span>
  ) : (
    <button type="button" className={`${viewButtonClassName} cursor-pointer`}>
      {viewPropertyLabel}
      <ArrowRight
        size={14}
        className="transition-transform duration-300 group-hover:translate-x-1"
      />
    </button>
  )

  const cardInfo = (
    <div className={cardInfoClass}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="truncate font-label-nav text-[10px] uppercase tracking-[0.18em] text-secondary">
          {property.location}
        </p>
        {shownReference ? (
          <span className="whitespace-nowrap rounded-md border border-secondary/20 bg-surface-sand/80 px-2 py-0.5 font-label-sm text-[10px] uppercase tracking-[0.08em] text-on-surface/55">
            {refPrefixLabel} {shownReference}
          </span>
        ) : null}
      </div>
      <h3 className="mb-3 line-clamp-2 min-h-[2.6em] font-headline-md text-[1.1rem] font-light leading-snug tracking-[0.01em] text-primary md:text-[1.2rem]">
        {property.title
          ? formatTitle(property.title)
          : ''}
      </h3>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={chipClassName}>
          <Bed size={13} className="text-secondary" />
          {property.beds ?? 0}
        </span>
        <span className={chipClassName}>
          <Bath size={13} className="text-secondary" />
          {property.baths ?? 0}
        </span>
        <span className={chipClassName}>
          <Ruler size={13} className="text-secondary" />
          {formatPropertyAreaDisplay(property.sqft)}
        </span>
      </div>
      <div className="mb-4 border-t border-secondary/25 pt-3">
        <div className="text-right">
          {displayPrice ? (
            <span className="block font-headline-md text-[1.2rem] font-light text-primary md:text-[1.3rem]">
              {displayPrice}
            </span>
          ) : null}
          {displayPriceSubtext ? (
            <span className="mt-0.5 block font-label-sm text-[11px] font-normal text-on-surface/55">
              {displayPriceSubtext}
            </span>
          ) : null}
        </div>
      </div>
      {viewButton}
    </div>
  )

  const handleDetailNavigate = () => {
    const reference = property.reference?.trim()
    if (!href || !reference) return
    if (detailFetchStatuses?.length) {
      stashPropertyDetailFetchStatus(reference, detailFetchStatuses)
    }
    if (detailListingContext) {
      stashPropertyDetailListingContext(reference, detailListingContext)
    }
  }

  const cardShellClass = `group ${cardBase} ${className}`.trim()

  return (
    <article
      className={cardShellClass}
      style={style}
      onMouseEnter={onCardEngage}
      onMouseLeave={onCardRelease}
    >
      <div className={imageWrapperClass}>
        <PropertyCardImageGallery
          title={property.title}
          imageResource={property.imageResource}
          imageUrl={property.imageUrl}
          imageUrls={property.imageUrls}
          href={href}
          onNavigate={handleDetailNavigate}
          onInteract={onCardEngage}
        />
        {propertyId != null && propertyId !== '' && (
          <button
            type="button"
            aria-label={favorited ? removeFromFavoritesLabel : addToFavoritesLabel}
            aria-pressed={favorited}
            onMouseDown={handleFavoritePointer}
            onClick={handleFavoriteClick}
            className="absolute top-3 left-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-secondary/50 bg-surface-cream/90 text-primary backdrop-blur-md transition-colors hover:border-secondary hover:bg-secondary hover:text-on-secondary"
          >
            <Star
              size={16}
              strokeWidth={1.75}
              className={favorited ? 'fill-secondary text-secondary' : 'fill-none'}
            />
          </button>
        )}
        {statusBadgeDisplay && (
          <div className="absolute top-3 right-3 rounded-md bg-primary/90 px-3 py-1 font-label-nav text-[10px] uppercase tracking-[0.14em] text-on-primary backdrop-blur-md">
            {statusBadgeDisplay}
          </div>
        )}
      </div>
      {href ? (
        <Link
          href={href}
          prefetch={false}
          onClick={handleDetailNavigate}
          className="relative z-10 flex flex-1 flex-col text-inherit no-underline cursor-pointer"
        >
          {cardInfo}
        </Link>
      ) : (
        cardInfo
      )}
    </article>
  )
}
