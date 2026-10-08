'use client'

import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import {
  getBlockedDateKeys,
  getBookingOccupiedDateKeys,
  parseDateOnly,
  resolveBookingDisplayStatus,
  toDateKey,
  type CRMPropertyBooking,
} from '@/utilities/holidayRentalPricing'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  bookings?: CRMPropertyBooking[]
  arrival?: string
  departure?: string
  onArrivalChange?: (value: string) => void
  onDepartureChange?: (value: string) => void
  /** When false, calendar only displays availability (no date selection). */
  interactive?: boolean
  months?: 1 | 2
  compact?: boolean
  showLegend?: boolean
  /** When `availability`, legend shows only Enquiry / Booked / Unavailable. */
  legendVariant?: 'all' | 'availability'
  showClear?: boolean
  showTitle?: boolean
  title?: string
  className?: string
}

type RangePosition = 'none' | 'start' | 'middle' | 'end' | 'single'

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const startOfMonth = (year: number, month: number) => new Date(year, month, 1)

const addMonths = (date: Date, count: number) =>
  new Date(date.getFullYear(), date.getMonth() + count, 1)

const isSameDay = (a: Date, b: Date) => toDateKey(a) === toDateKey(b)

const isBetweenRange = (day: Date, from: Date, to: Date) => {
  const key = day.getTime()
  return key > from.getTime() && key < to.getTime()
}

const getRangePosition = (
  day: Date,
  arrivalDate: Date | null,
  departureDate: Date | null,
): RangePosition => {
  if (!arrivalDate) return 'none'
  if (!departureDate) return isSameDay(day, arrivalDate) ? 'single' : 'none'
  if (isSameDay(day, arrivalDate) && isSameDay(day, departureDate)) return 'single'
  if (isSameDay(day, arrivalDate)) return 'start'
  if (isSameDay(day, departureDate)) return 'end'
  if (isBetweenRange(day, arrivalDate, departureDate)) return 'middle'
  return 'none'
}

const rangeTrackClass = (position: RangePosition) => {
  switch (position) {
    case 'start':
      return 'before:absolute before:inset-y-[3px] before:left-1/2 before:right-0 before:bg-tertiary/14 before:content-[""]'
    case 'end':
      return 'before:absolute before:inset-y-[3px] before:left-0 before:right-1/2 before:bg-tertiary/14 before:content-[""]'
    case 'middle':
      return 'before:absolute before:inset-y-[3px] before:inset-x-0 before:bg-tertiary/14 before:content-[""]'
    default:
      return ''
  }
}

type MonthGridProps = {
  monthDate: Date
  todayKey: string
  blocked: Set<string>
  blockedStatusByKey: Map<string, 'enquiry' | 'booked' | 'other'>
  arrivalDate: Date | null
  departureDate: Date | null
  interactive: boolean
  compact: boolean
  weekdayLabels: Record<(typeof WEEKDAY_KEYS)[number], string>
  onDayClick?: (day: Date) => void
  showMonthLabel?: boolean
  showMonthNav?: boolean
  canGoPrev?: boolean
  onPrevMonth?: () => void
  onNextMonth?: () => void
}

const MonthGrid: React.FC<MonthGridProps> = ({
  monthDate,
  todayKey,
  blocked,
  blockedStatusByKey,
  arrivalDate,
  departureDate,
  interactive,
  compact,
  weekdayLabels,
  onDayClick,
  showMonthLabel = true,
  showMonthNav = false,
  canGoPrev = true,
  onPrevMonth,
  onNextMonth,
}) => {
  const monthLabel = monthDate.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  const navButtonClass =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors cursor-pointer hover:bg-surface-container-low hover:text-primary disabled:cursor-not-allowed disabled:opacity-30'

  const days = useMemo(() => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDay = startOfMonth(year, month)
    const startOffset = (firstDay.getDay() + 6) % 7
    const gridStart = new Date(year, month, 1 - startOffset)
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + index)
      return date
    })
  }, [monthDate])

  const cellSize = compact
    ? 'h-9 w-9 text-[12px] sm:h-8 sm:w-8'
    : 'h-9 w-9 text-[13px] sm:h-10 sm:w-10'
  const rowHeight = compact ? 'h-10 sm:h-9' : 'h-10 sm:h-11'

  return (
    <div className="min-w-0 flex-1">
      {showMonthNav ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoPrev}
            onClick={onPrevMonth}
            className={navButtonClass}
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
          <p className="min-w-0 flex-1 text-center font-label-sm text-label-sm text-on-surface">
            {monthLabel}
          </p>
          <button
            type="button"
            aria-label="Next month"
            onClick={onNextMonth}
            className={navButtonClass}
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
      ) : (
        showMonthLabel && (
          <p className="mb-2 text-center font-label-sm text-label-sm text-on-surface">
            {monthLabel}
          </p>
        )
      )}
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAY_KEYS.map((key) => (
          <div
            key={key}
            className="py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-on-surface-variant/70"
          >
            {weekdayLabels[key]}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = toDateKey(day)
          const inMonth = day.getMonth() === monthDate.getMonth()
          const isPast = key < todayKey
          const isBlocked = blocked.has(key)
          const blockedStatus = blockedStatusByKey.get(key)
          const disabled = isPast || isBlocked
          const isArrival = arrivalDate ? isSameDay(day, arrivalDate) : false
          const isDeparture = departureDate ? isSameDay(day, departureDate) : false
          const rangePosition = getRangePosition(day, arrivalDate, departureDate)
          const isEndpoint = isArrival || isDeparture

          let buttonClass = `relative z-[1] mx-auto flex ${cellSize} items-center justify-center rounded-full font-medium transition-all duration-150`

          if (!inMonth) {
            buttonClass += ' text-transparent pointer-events-none'
          } else if (isBlocked && !isEndpoint) {
            if (blockedStatus === 'enquiry') {
              buttonClass +=
                ' cursor-not-allowed bg-amber-100/90 text-amber-900/70 line-through decoration-amber-700/40'
            } else if (blockedStatus === 'booked') {
              buttonClass +=
                ' cursor-default bg-red-100/80 text-red-900/60 line-through decoration-red-700/40'
            } else {
              buttonClass += ' cursor-default bg-surface-container-low text-on-surface-variant/35'
            }
          } else if (disabled && rangePosition === 'none') {
            buttonClass +=
              ' cursor-not-allowed text-on-surface-variant/30 bg-surface-container-low/60'
          } else if (isEndpoint || rangePosition === 'single') {
            buttonClass += ' bg-primary text-white shadow-sm'
            if (interactive && !disabled) {
              buttonClass += ' hover:bg-primary/90'
            }
          } else if (rangePosition === 'middle') {
            buttonClass += ' text-primary'
            if (interactive && !disabled) {
              buttonClass += ' hover:bg-tertiary/20'
            }
          } else if (interactive) {
            buttonClass += ' cursor-pointer text-on-surface hover:bg-surface-container-low'
          } else {
            buttonClass += ' text-on-surface'
          }

          if (!inMonth) {
            return <div key={key} aria-hidden className={`relative ${rowHeight}`} />
          }

          const dayButton = (
            <button
              type="button"
              disabled={interactive ? disabled : true}
              onClick={interactive && onDayClick ? () => onDayClick(day) : undefined}
              className={buttonClass}
              aria-pressed={isEndpoint || rangePosition === 'middle'}
              aria-label={day.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            >
              {day.getDate()}
            </button>
          )

          return (
            <div
              key={key}
              className={`relative flex ${rowHeight} items-center justify-center ${rangeTrackClass(rangePosition)}`}
            >
              {interactive ? (
                dayButton
              ) : (
                <div className={buttonClass} aria-hidden={!inMonth}>
                  {day.getDate()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const PropertyHolidayCalendar: React.FC<Props> = ({
  bookings = [],
  arrival = '',
  departure = '',
  onArrivalChange,
  onDepartureChange,
  interactive = true,
  months = 1,
  compact = false,
  showLegend = true,
  legendVariant = 'all',
  showClear = true,
  showTitle = true,
  title,
  className = '',
}) => {
  const availabilityLabel = useTranslation('propertyDetail.holiday.availability', 'Availability')
  const clearDatesLabel = useTranslation('propertyDetail.holiday.clearDates', 'Clear dates')
  const weekdayLabels = {
    mon: useTranslation('propertyDetail.holiday.weekdays.mon', 'Mon'),
    tue: useTranslation('propertyDetail.holiday.weekdays.tue', 'Tue'),
    wed: useTranslation('propertyDetail.holiday.weekdays.wed', 'Wed'),
    thu: useTranslation('propertyDetail.holiday.weekdays.thu', 'Thu'),
    fri: useTranslation('propertyDetail.holiday.weekdays.fri', 'Fri'),
    sat: useTranslation('propertyDetail.holiday.weekdays.sat', 'Sat'),
    sun: useTranslation('propertyDetail.holiday.weekdays.sun', 'Sun'),
  }

  const todayKey = toDateKey(new Date())
  const blocked = useMemo(() => getBlockedDateKeys(bookings), [bookings])

  const blockedStatusByKey = useMemo(() => {
    const map = new Map<string, 'enquiry' | 'booked' | 'other'>()
    for (const booking of bookings) {
      const status = resolveBookingDisplayStatus(booking.status)
      for (const key of getBookingOccupiedDateKeys(booking)) {
        map.set(key, status)
      }
    }
    return map
  }, [bookings])

  const arrivalDate = parseDateOnly(arrival)
  const departureDate = parseDateOnly(departure)

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const seed = arrivalDate ?? new Date()
    return startOfMonth(seed.getFullYear(), seed.getMonth())
  })

  const currentMonthStart = startOfMonth(new Date().getFullYear(), new Date().getMonth())
  const canGoPrev = visibleMonth.getTime() > currentMonthStart.getTime()

  const monthDates = useMemo(
    () => Array.from({ length: months }, (_, index) => addMonths(visibleMonth, index)),
    [visibleMonth, months],
  )

  const handleDayClick = (day: Date) => {
    if (!interactive || !onArrivalChange || !onDepartureChange) return

    const key = toDateKey(day)
    if (key < todayKey || blocked.has(key)) return

    if (!arrivalDate || (arrivalDate && departureDate)) {
      onArrivalChange(key)
      onDepartureChange('')
      return
    }

    if (day <= arrivalDate) {
      onArrivalChange(key)
      onDepartureChange('')
      return
    }

    onDepartureChange(key)
  }

  const handleClearDates = () => {
    onArrivalChange?.('')
    onDepartureChange?.('')
  }

  const headerTitle = title ?? availabilityLabel

  const handlePrevMonth = () => setVisibleMonth((current) => addMonths(current, -1))
  const handleNextMonth = () => setVisibleMonth((current) => addMonths(current, 1))

  const monthLabels = monthDates.map((monthDate) =>
    monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  )

  return (
    <div
      className={`overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-container-lowest ${className}`}
    >
      {showTitle && (
        <div className="border-b border-outline-variant/15 px-4 py-3.5">
          <h3 className="font-headline-sm text-headline-sm text-primary">{headerTitle}</h3>
        </div>
      )}

      {months === 2 && (
        <div className="flex items-center justify-between gap-2 border-b border-outline-variant/15 px-2 py-3 sm:gap-3 sm:px-3">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoPrev}
            onClick={handlePrevMonth}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full cursor-pointer text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 sm:flex-row sm:gap-6 lg:gap-10">
            {monthLabels.map((label) => (
              <span
                key={label}
                className="truncate text-center font-label-sm text-label-sm text-on-surface"
              >
                {label}
              </span>
            ))}
          </div>
          <button
            type="button"
            aria-label="Next month"
            onClick={handleNextMonth}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full cursor-pointer text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
      )}

      <div
        className={`px-2 pb-3 pt-3 sm:px-3 ${months === 2 ? 'grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6' : ''}`}
      >
        {monthDates.map((monthDate) => (
          <MonthGrid
            key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
            monthDate={monthDate}
            todayKey={todayKey}
            blocked={blocked}
            blockedStatusByKey={blockedStatusByKey}
            arrivalDate={arrivalDate}
            departureDate={departureDate}
            interactive={interactive}
            compact={compact}
            weekdayLabels={weekdayLabels}
            onDayClick={handleDayClick}
            showMonthLabel={false}
            showMonthNav={months === 1}
            canGoPrev={canGoPrev}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        ))}
      </div>

      {showLegend && (
        <div className="flex flex-col gap-2 border-t border-outline-variant/15 bg-surface-container-lowest/60 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-on-surface-variant sm:gap-x-4">
            {interactive && legendVariant === 'all' && (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  Check-in / out
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-tertiary/25" />
                  Your stay
                </span>
              </>
            )}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-100 ring-1 ring-amber-300/60" />
              Enquiry
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-100 ring-1 ring-red-300/60" />
              Booked
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-surface-container-low" />
              Unavailable
            </span>
          </div>

          {showClear && interactive && (arrival || departure) && (
            <button
              type="button"
              onClick={handleClearDates}
              className="text-[11px] font-medium text-tertiary underline-offset-2 hover:underline"
            >
              {clearDatesLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
