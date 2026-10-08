'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

import { PropertyHolidayCalendar } from '@/components/PropertyDetail/PropertyHolidayCalendar'
import type { CRMPropertyBooking } from '@/utilities/holidayRentalPricing'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  bookings?: CRMPropertyBooking[]
  arrival?: string
  departure?: string
  refreshing?: boolean
}

export const PropertyHolidayAvailabilityPanel: React.FC<Props> = ({
  bookings = [],
  arrival = '',
  departure = '',
  refreshing = false,
}) => {
  const heading = useTranslation(
    'propertyDetail.holiday.availabilitySectionHeading',
    'Availability',
  )
  const subtitle = useTranslation(
    'propertyDetail.holiday.availabilitySectionSubtitle',
    'Blocked dates reflect existing enquiries and confirmed stays from the CRM calendar.',
  )
  const refreshingLabel = useTranslation(
    'propertyDetail.holiday.availabilityRefreshing',
    'Updating availability…',
  )

  return (
    <section className="mt-10 border-t border-secondary/20 pt-10 md:mt-16 md:pt-16">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-headline-md text-headline-md text-primary">{heading}</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">{subtitle}</p>
        {refreshing && (
          <p className="mt-2 flex items-center gap-2 text-body-sm text-secondary">
            <Loader2 size={14} className="animate-spin" strokeWidth={2} />
            {refreshingLabel}
          </p>
        )}
      </div>

      <div className={refreshing ? 'opacity-70 transition-opacity' : undefined}>
        <PropertyHolidayCalendar
          bookings={bookings}
          arrival={arrival}
          departure={departure}
          interactive={false}
          months={2}
          showLegend
          legendVariant="availability"
          showClear={false}
        />
      </div>
    </section>
  )
}
