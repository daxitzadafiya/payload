'use client'

import { CalendarDays, Printer, Star } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { useDocumentDownload } from '@/components/DocumentDownload/DocumentDownloadProvider'
import { PropertyDetailShareMenu } from '@/components/PropertyDetail/PropertyDetailShareMenu'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import type { FavoritePropertyId } from '@/utilities/propertyFavorites'
import { useTranslation } from '@/utilities/translateClient'

type FavoriteButtonProps = {
  propertyId?: FavoritePropertyId | null
  /** Projects use a separate favorites cookie. */
  kind?: 'property' | 'project'
  className?: string
  size?: 'default' | 'compact' | 'responsive'
}

export const PropertyDetailFavoriteButton: React.FC<FavoriteButtonProps> = ({
  propertyId,
  kind = 'property',
  className = '',
  size = 'default',
}) => {
  const {
    isFavorite: isPropertyFavorite,
    toggleFavorite: togglePropertyFavorite,
    isProjectFavorite,
    toggleProjectFavorite,
  } = usePropertyFavorites()
  const isFavorite = kind === 'project' ? isProjectFavorite : isPropertyFavorite
  const toggleFavorite = kind === 'project' ? toggleProjectFavorite : togglePropertyFavorite
  const favorited = propertyId != null && propertyId !== '' && isFavorite(propertyId)
  const addToFavoritesLabel = useTranslation(
    'propertyList.card.addToFavorites',
    'Add to favorites',
  )
  const removeFromFavoritesLabel = useTranslation(
    'propertyList.card.removeFromFavorites',
    'Remove from favorites',
  )

  if (propertyId == null || propertyId === '') return null

  const buttonSizeClass =
    size === 'compact'
      ? 'w-10 h-10'
      : size === 'responsive'
        ? 'w-10 h-10 md:w-12 md:h-12'
        : 'w-12 h-12'

  const iconSizeClass =
    size === 'compact'
      ? 'w-[18px] h-[18px]'
      : size === 'responsive'
        ? 'w-[18px] h-[18px] md:w-[22px] md:h-[22px]'
        : 'w-[22px] h-[22px]'

  return (
    <button
      type="button"
      aria-label={favorited ? removeFromFavoritesLabel : addToFavoritesLabel}
      aria-pressed={favorited}
      onClick={() => toggleFavorite(propertyId)}
      className={`inline-flex ${buttonSizeClass} shrink-0 cursor-pointer items-center justify-center rounded-md border border-outline-variant/40 bg-transparent p-0 text-primary transition-all hover:border-secondary hover:bg-secondary hover:text-on-secondary ${className}`.trim()}
    >
      <Star
        className={`${iconSizeClass} block ${favorited ? 'fill-secondary text-secondary' : 'fill-none'}`}
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  )
}

export const HOLIDAY_BOOKING_SECTION_ID = 'property-holiday-booking'

type FooterActionsProps = {
  brochureUrl?: string
  /** Holiday rentals only — scrolls to the booking form. */
  showBookStay?: boolean
}

export const PropertyDetailFooterActions: React.FC<FooterActionsProps> = ({
  brochureUrl,
  showBookStay = false,
}) => {
  const { requestDownload } = useDocumentDownload()
  const printPdfLabel = useTranslation('propertyDetail.actions.printPdf', 'Print PDF')
  const requestViewingLabel = useTranslation(
    'propertyDetail.actions.requestViewing',
    'Request Viewing',
  )
  const bookYourStayLabel = useTranslation(
    'propertyDetail.actions.bookYourStay',
    'Book your stay',
  )

  const scrollToBooking = () => {
    document.getElementById(HOLIDAY_BOOKING_SECTION_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const primaryCtaClassName =
    'flex h-[50px] cursor-pointer items-center justify-center gap-2 rounded-md border border-secondary bg-secondary px-4 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-secondary shadow-[0_10px_28px_-16px_color-mix(in_srgb,var(--color-secondary)_65%,transparent)] transition-all duration-300 hover:border-primary hover:bg-primary hover:text-on-primary sm:h-[52px] sm:text-[12px]'

  const secondaryCtaClassName =
    'flex h-[50px] min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-secondary/45 bg-transparent px-4 font-label-nav text-[11px] uppercase tracking-[0.16em] text-secondary transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-on-secondary sm:h-[52px] sm:text-[12px]'

  const utilityCtaClassName = showBookStay ? secondaryCtaClassName : `${primaryCtaClassName} flex-1`

  return (
    <div className="mt-6 flex flex-col gap-2.5 border-t border-secondary/20 pt-5">
      {showBookStay ? (
        <button type="button" className={`${primaryCtaClassName} w-full`} onClick={scrollToBooking}>
          <CalendarDays size={16} strokeWidth={1.75} aria-hidden />
          <span>{bookYourStayLabel}</span>
        </button>
      ) : null}
      <div className="flex items-center gap-2.5">
        {brochureUrl ? (
          <button
            type="button"
            className={utilityCtaClassName}
            onClick={() =>
              requestDownload({
                url: brochureUrl,
                actionLabel: printPdfLabel,
                documentLabel: printPdfLabel,
                kind: 'pdf',
              })
            }
          >
            <Printer size={16} strokeWidth={1.75} aria-hidden />
            <span>{printPdfLabel}</span>
          </button>
        ) : (
          <Link href="#property-inquiry" className={utilityCtaClassName}>
            {requestViewingLabel}
          </Link>
        )}
        <PropertyDetailShareMenu />
      </div>
    </div>
  )
}
