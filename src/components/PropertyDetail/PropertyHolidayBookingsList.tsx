'use client'

import React, { useMemo } from 'react'
import { CalendarRange, Moon, Users } from 'lucide-react'

import {
  formatBookingDateRange,
  formatEuro,
  resolveBookingDisplayStatus,
  resolveBookingGuestCount,
  resolveBookingPrice,
  sortBookingsByArrival,
  type CRMPropertyBooking,
} from '@/utilities/holidayRentalPricing'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  bookings?: CRMPropertyBooking[]
}

const statusBadgeClass = (status: ReturnType<typeof resolveBookingDisplayStatus>) => {
  switch (status) {
    case 'enquiry':
      return 'bg-amber-50 text-amber-800 ring-amber-200/80'
    case 'booked':
      return 'bg-red-50 text-red-800 ring-red-200/80'
    default:
      return 'bg-surface-container-low text-on-surface-variant ring-outline-variant/20'
  }
}

export const PropertyHolidayBookingsList: React.FC<Props> = ({ bookings = [] }) => {
  const heading = useTranslation(
    'propertyDetail.holiday.bookingsHeading',
    'Existing bookings',
  )
  const emptyLabel = useTranslation(
    'propertyDetail.holiday.noBookings',
    'No upcoming bookings on record.',
  )
  const nightsLabel = useTranslation('propertyDetail.holiday.nights', 'nights')
  const guestsLabel = useTranslation('propertyList.filters.guests', 'Guests')
  const refLabel = useTranslation('propertyDetail.map.refPrefix', 'Ref:')

  const sorted = useMemo(() => sortBookingsByArrival(bookings), [bookings])

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-lowest/50 px-5 py-8 text-center">
        <p className="font-headline-sm text-headline-sm text-primary">{heading}</p>
        <p className="mt-2 text-body-sm text-on-surface-variant">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-headline-sm text-headline-sm text-primary">{heading}</h3>
      <ul className="space-y-3">
        {sorted.map((booking) => {
          const status = resolveBookingDisplayStatus(booking.status)
          const statusLabel =
            status === 'enquiry'
              ? 'Enquiry'
              : status === 'booked'
                ? 'Booked'
                : booking.status?.trim() || 'Reserved'

          const guestCount = resolveBookingGuestCount(booking)
          const price = resolveBookingPrice(booking)
          const key = booking._id ?? booking.reference ?? formatBookingDateRange(booking)

          return (
            <li
              key={key}
              className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2 text-body-sm font-medium text-on-surface">
                    <CalendarRange size={16} className="shrink-0 text-tertiary" />
                    <span>{formatBookingDateRange(booking)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-body-sm text-on-surface-variant">
                    {booking.nights != null && booking.nights > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Moon size={14} className="text-tertiary/80" />
                        {booking.nights} {nightsLabel}
                      </span>
                    )}
                    {guestCount != null && (
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={14} className="text-tertiary/80" />
                        {guestCount} {guestsLabel.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${statusBadgeClass(status)}`}
                >
                  {statusLabel}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/10 pt-3 text-body-sm">
                {price != null && (
                  <span className="font-semibold text-tertiary">{formatEuro(price)}</span>
                )}
                {booking.reference && (
                  <span className="text-on-surface-variant">
                    {refLabel} {booking.reference}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
