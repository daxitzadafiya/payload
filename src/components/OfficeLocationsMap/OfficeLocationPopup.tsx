'use client'

import { Mail, MapPin, Navigation, Phone, X } from 'lucide-react'
import React from 'react'

import type { ContactOfficeLocation } from '@/utilities/contactOfficeLocations'

type Props = {
  location: ContactOfficeLocation
  directionsLabel: string
  onClose?: () => void
  variant?: 'floating' | 'sheet'
}

export const OfficeLocationPopup: React.FC<Props> = ({
  location,
  directionsLabel,
  onClose,
  variant = 'floating',
}) => {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lon}`
  const isSheet = variant === 'sheet'

  const closeButton = onClose ? (
    <button
      type="button"
      aria-label="Close"
      className={
        isSheet && location.imageUrl
          ? 'inline-flex size-9 items-center justify-center rounded-full bg-surface-cream/95 text-primary shadow-md backdrop-blur-sm transition-colors hover:bg-white sm:size-10'
          : 'inline-flex size-8 items-center justify-center rounded-full text-on-surface/50 transition-colors hover:bg-surface-sand hover:text-primary sm:size-9'
      }
      onClick={onClose}
    >
      <X size={18} strokeWidth={1.75} />
    </button>
  ) : null

  return (
    <article
      className={
        isSheet
          ? 'flex max-h-[min(72dvh,28rem)] w-full flex-col overflow-hidden rounded-t-[1.5rem] border border-secondary/25 bg-surface-cream shadow-[0_-16px_48px_-20px_rgba(0,0,0,0.35)] sm:max-h-[min(68dvh,30rem)] sm:rounded-t-[1.75rem]'
          : 'w-[min(300px,calc(100vw-2rem))] overflow-hidden rounded-[1.25rem] border border-secondary/30 bg-surface-cream shadow-[0_28px_60px_-28px_rgba(0,0,0,0.45)] sm:w-[min(320px,calc(100vw-2.5rem))] sm:rounded-[1.5rem]'
      }
    >
      {isSheet && location.imageUrl ? (
        <div className="relative h-42 w-full shrink-0 overflow-hidden sm:h-36">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="h-full w-full object-cover" src={location.imageUrl} />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-primary/10" />
          <span
            className="pointer-events-none absolute left-4 top-4 h-7 w-7 border-l-2 border-t-2 border-secondary"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute right-4 top-4 h-7 w-7 border-r-2 border-t-2 border-secondary"
            aria-hidden
          />
          {closeButton ? (
            <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">{closeButton}</div>
          ) : null}
        </div>
      ) : (
        <>
          {closeButton && !location.imageUrl ? (
            <div className="flex shrink-0 justify-end p-2 pb-0 sm:p-3">{closeButton}</div>
          ) : null}
          {location.imageUrl ? (
            <div
              className={`relative w-full shrink-0 overflow-hidden ${isSheet ? 'h-28 sm:h-32' : 'h-36 sm:h-40'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="h-full w-full object-cover" src={location.imageUrl} />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent" />
              <span
                className="pointer-events-none absolute left-3.5 top-3.5 h-6 w-6 border-l-2 border-t-2 border-secondary sm:left-4 sm:top-4 sm:h-7 sm:w-7"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute right-3.5 top-3.5 h-6 w-6 border-r-2 border-t-2 border-secondary sm:right-4 sm:top-4 sm:h-7 sm:w-7"
                aria-hidden
              />
              {closeButton ? (
                <div className="absolute right-2.5 top-2.5 z-10 sm:right-3 sm:top-3">{closeButton}</div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
          isSheet ? 'space-y-3.5 p-4 sm:space-y-4 sm:p-5' : 'space-y-4 p-4 sm:p-5'
        }`}
      >
        <div>
          {location.label ? (
            <p className="mb-2 font-label-nav text-[10px] uppercase tracking-[0.28em] text-secondary sm:text-[11px]">
              {location.label}
            </p>
          ) : null}
          <h3 className="m-0 font-headline-md text-[clamp(1.25rem,2vw,1.5rem)] font-light leading-[1.2] tracking-[0.01em] text-primary">
            {location.city}
          </h3>
          <div className="mt-3 h-px w-10 bg-secondary" aria-hidden />
          {location.address ? (
            <p className="mt-3 flex items-start gap-2 font-body-sm text-[13px] font-light leading-[1.55] text-on-surface/65 sm:text-[14px]">
              <MapPin className="mt-0.5 shrink-0 text-secondary" size={15} strokeWidth={1.6} />
              <span>{location.address}</span>
            </p>
          ) : null}
        </div>

        {(location.phone || location.email) && (
          <div className="space-y-2.5 border-t border-secondary/20 pt-3.5">
            {location.phone ? (
              <a
                className="flex items-center gap-2.5 font-body-md text-[13px] text-primary transition-colors hover:text-secondary sm:text-[14px]"
                href={`tel:${location.phone.replace(/\s/g, '')}`}
              >
                <Phone size={15} className="shrink-0 text-secondary" strokeWidth={1.6} />
                {location.phone}
              </a>
            ) : null}
            {location.email ? (
              <a
                className="flex items-center gap-2.5 break-all font-body-md text-[13px] text-primary transition-colors hover:text-secondary sm:text-[14px]"
                href={`mailto:${location.email}`}
              >
                <Mail size={15} className="shrink-0 text-secondary" strokeWidth={1.6} />
                {location.email}
              </a>
            ) : null}
          </div>
        )}

        <a
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-label-nav text-[11px] uppercase tracking-[0.16em] text-on-primary transition-all duration-300 hover:bg-secondary hover:text-on-secondary active:scale-[0.98] sm:py-3.5"
          href={directionsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Navigation size={15} strokeWidth={1.75} />
          {directionsLabel}
        </a>
      </div>
    </article>
  )
}
