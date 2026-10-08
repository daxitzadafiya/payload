'use client'

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

import { FLOATING_MENU_Z_INDEX } from '@/utilities/floatingMenuPosition'
import { cn } from '@/utilities/ui'
import { useTranslation } from '@/utilities/translateClient'

type Props = {
  id: string
  label: string
  periodFrom: string
  periodTo: string
  onPeriodFromChange: (value: string) => void
  onPeriodToChange: (value: string) => void
  triggerClassName?: string
  labelClassName?: string
  panelClassName?: string
  iconClassName?: string
  openDirection?: 'up' | 'down'
}

const MOBILE_MEDIA = '(max-width: 63.999rem)'
const DESKTOP_PANEL_WIDTH = 704

const defaultTriggerClassName =
  'w-full rounded-lg border border-outline-variant/35 bg-surface-cream py-2.5 pl-10 pr-10 text-left font-body-md text-[15px] text-on-surface transition-colors duration-300 focus:border-secondary focus:bg-surface-container-lowest focus:ring-0 md:py-3'

const defaultLabelClassName =
  'mb-1.5 ml-0.5 block font-label-sm text-[11px] font-normal uppercase tracking-[0.1em] text-on-surface-variant'

const defaultPanelClassName = 'rounded-2xl border border-outline-variant/30 bg-surface shadow-2xl'

const defaultIconClassName = 'pointer-events-none text-secondary'

const weekdayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

function subscribeMobileDatePicker(callback: () => void) {
  const media = window.matchMedia(MOBILE_MEDIA)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function getMobileDatePickerSnapshot() {
  return window.matchMedia(MOBILE_MEDIA).matches
}

function getMobileDatePickerServerSnapshot() {
  return true
}

function useMobileDatePicker() {
  return useSyncExternalStore(
    subscribeMobileDatePicker,
    getMobileDatePickerSnapshot,
    getMobileDatePickerServerSnapshot,
  )
}

const toDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateKey = (value: string): Date | null => {
  if (!value) return null
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

const addMonths = (date: Date, count: number) =>
  new Date(date.getFullYear(), date.getMonth() + count, 1)

const isSameDay = (a: Date, b: Date) => toDateKey(a) === toDateKey(b)

const isBetween = (target: Date, start: Date, end: Date) =>
  target.getTime() > start.getTime() && target.getTime() < end.getTime()

const buildMonthGrid = (monthDate: Date): Date[] => {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const firstWeekday = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - firstWeekday)
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })
}

const formatDateLabel = (value: string): string => {
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(timestamp)) return value
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatDateShort = (value: string): string => {
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  if (!Number.isFinite(timestamp)) return value
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}

type MonthCalendarProps = {
  monthDate: Date
  today: Date
  fromDate: Date | null
  toDate: Date | null
  weekdayLabels: Record<(typeof weekdayKeys)[number], string>
  compact?: boolean
  onPrevMonth?: () => void
  onNextMonth?: () => void
  onDatePick: (date: Date) => void
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({
  monthDate,
  today,
  fromDate,
  toDate,
  weekdayLabels,
  compact = false,
  onPrevMonth,
  onNextMonth,
  onDatePick,
}) => {
  const monthLabel = monthDate.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
  const days = useMemo(() => buildMonthGrid(monthDate), [monthDate])
  const cellSize = compact ? 'h-8 w-8 text-xs sm:h-9 sm:w-9' : 'h-9 w-9 text-xs sm:h-10 sm:w-10'

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-label-sm font-semibold text-on-surface">
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={onNextMonth}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7">
        {weekdayKeys.map((key) => (
          <div
            key={key}
            className="py-1 text-center text-[10px] font-medium uppercase text-on-surface-variant/70"
          >
            {weekdayLabels[key]}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const inMonth = day.getMonth() === monthDate.getMonth()
          const isPast = day.getTime() < today.getTime()
          const selectedFrom = fromDate ? isSameDay(day, fromDate) : false
          const selectedTo = toDate ? isSameDay(day, toDate) : false
          const inRange = fromDate && toDate ? isBetween(day, fromDate, toDate) : false
          const disabled = !inMonth || isPast

          const cellClass = cn(
            'mx-auto flex items-center justify-center rounded-full transition-colors',
            cellSize,
            disabled
              ? 'text-on-surface-variant/25 cursor-not-allowed'
              : 'cursor-pointer text-on-surface-variant hover:bg-tertiary/20 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/30',
            inRange && 'bg-tertiary/15 text-primary hover:bg-tertiary/25 cursor-not-allowed',
            (selectedFrom || selectedTo) && 'bg-primary text-white hover:bg-primary/90',
          )

          return (
            <button
              key={toDateKey(day)}
              type="button"
              disabled={disabled}
              onClick={() => onDatePick(day)}
              className={cellClass}
              aria-pressed={Boolean(inRange || selectedFrom || selectedTo)}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const DateRangePickerField: React.FC<Props> = ({
  id,
  label,
  periodFrom,
  periodTo,
  onPeriodFromChange,
  onPeriodToChange,
  triggerClassName = defaultTriggerClassName,
  labelClassName = defaultLabelClassName,
  panelClassName = defaultPanelClassName,
  iconClassName = defaultIconClassName,
  openDirection = 'down',
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const isMobile = useMobileDatePicker()

  const clearLabel = useTranslation('propertyList.filters.clearFilters', 'Clear Filters')
  const doneLabel = useTranslation('common.done', 'Done')
  const datePlaceholder = useTranslation(
    'propertyList.filters.dateRangePlaceholder',
    'Select dates',
  )
  const selectedRangeLabel = useTranslation('propertyList.filters.selectedRange', 'Selected range')
  const checkInLabel = useTranslation('propertyList.holiday.checkIn', 'Check-in')
  const checkOutLabel = useTranslation('propertyList.holiday.checkOut', 'Check-out')
  const weekdayLabels = {
    mon: useTranslation('propertyDetail.holiday.weekdays.mon', 'Mon'),
    tue: useTranslation('propertyDetail.holiday.weekdays.tue', 'Tue'),
    wed: useTranslation('propertyDetail.holiday.weekdays.wed', 'Wed'),
    thu: useTranslation('propertyDetail.holiday.weekdays.thu', 'Thu'),
    fri: useTranslation('propertyDetail.holiday.weekdays.fri', 'Fri'),
    sat: useTranslation('propertyDetail.holiday.weekdays.sat', 'Sat'),
    sun: useTranslation('propertyDetail.holiday.weekdays.sun', 'Sun'),
  }

  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const fromDate = periodFrom ? parseDateKey(periodFrom) : null
  const toDate = periodTo ? parseDateKey(periodTo) : null
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(fromDate ?? today))

  const displayValue = useMemo(() => {
    if (periodFrom && periodTo) {
      const fromYear = periodFrom.slice(0, 4)
      const toYear = periodTo.slice(0, 4)
      const sameYear = fromYear === toYear
      return sameYear
        ? `${formatDateShort(periodFrom)} - ${formatDateShort(periodTo)} ${toYear}`
        : `${formatDateShort(periodFrom)} ${fromYear} - ${formatDateShort(periodTo)} ${toYear}`
    }
    if (periodFrom) return `${formatDateShort(periodFrom)} - ${datePlaceholder}`
    return datePlaceholder
  }, [periodFrom, periodTo, datePlaceholder])

  const monthDates = useMemo(() => {
    if (isMobile) return [visibleMonth]
    return [visibleMonth, addMonths(visibleMonth, 1)]
  }, [isMobile, visibleMonth])

  const handleClear = () => {
    onPeriodFromChange('')
    onPeriodToChange('')
  }

  const handleDatePick = (pickedDate: Date) => {
    const key = toDateKey(pickedDate)
    if (!fromDate || (fromDate && toDate)) {
      onPeriodFromChange(key)
      onPeriodToChange('')
      return
    }

    if (pickedDate <= fromDate) {
      onPeriodFromChange(key)
      onPeriodToChange('')
      return
    }

    onPeriodToChange(key)
  }

  const moveMonth = (delta: number) => {
    setVisibleMonth((current) => addMonths(current, delta))
  }

  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const seed = periodFrom ? parseDateKey(periodFrom) : null
      setVisibleMonth(startOfMonth(seed ?? today))
    }
    wasOpenRef.current = open
  }, [open, periodFrom, today])

  useEffect(() => {
    if (!open || !isMobile) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open, isMobile])

  useLayoutEffect(() => {
    if (!open || isMobile || !triggerRef.current) return

    const updatePosition = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect()
      if (!triggerRect) return

      const viewportPadding = 12
      const gap = 8
      const width = Math.min(window.innerWidth - viewportPadding * 2, DESKTOP_PANEL_WIDTH)
      const left = Math.max(
        viewportPadding,
        Math.min(
          triggerRect.left + triggerRect.width / 2 - width / 2,
          window.innerWidth - width - viewportPadding,
        ),
      )

      const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding
      const spaceAbove = triggerRect.top - viewportPadding
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 0
      const preferUp = openDirection === 'up'
      const openUp =
        preferUp ||
        (panelHeight > 0 &&
          triggerRect.bottom + gap + panelHeight > window.innerHeight - viewportPadding &&
          spaceAbove > spaceBelow)

      const availableSpace = (openUp ? spaceAbove : spaceBelow) - gap
      const needsScroll = panelHeight > 0 && panelHeight > availableSpace
      const maxHeight = needsScroll ? Math.max(200, availableSpace) : undefined

      if (openUp) {
        setPanelStyle({
          position: 'fixed',
          left,
          width,
          bottom: window.innerHeight - triggerRect.top + gap,
          ...(maxHeight ? { maxHeight } : {}),
          zIndex: FLOATING_MENU_Z_INDEX,
        })
        return
      }

      setPanelStyle({
        position: 'fixed',
        top: triggerRect.bottom + gap,
        left,
        width,
        ...(maxHeight ? { maxHeight } : {}),
        zIndex: FLOATING_MENU_Z_INDEX,
      })
    }

    updatePosition()

    let resizeObserver: ResizeObserver | null = null
    const raf = requestAnimationFrame(() => {
      updatePosition()
      if (typeof ResizeObserver !== 'undefined' && panelRef.current) {
        resizeObserver = new ResizeObserver(updatePosition)
        resizeObserver.observe(panelRef.current)
      }
    })

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      cancelAnimationFrame(raf)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, isMobile, openDirection, monthDates.length])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const panelContent = (
    <>
      <div className="mb-3 flex items-center justify-center gap-2">
        <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">
          {selectedRangeLabel}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low px-2.5 py-2 sm:px-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
            {checkInLabel}
          </p>
          <p className="truncate text-body-sm text-on-surface">
            {periodFrom ? formatDateLabel(periodFrom) : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low px-2.5 py-2 sm:px-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
            {checkOutLabel}
          </p>
          <p className="truncate text-body-sm text-on-surface">
            {periodTo ? formatDateLabel(periodTo) : '—'}
          </p>
        </div>
      </div>

      <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
        {monthDates.map((monthDate, monthIndex) => (
          <MonthCalendar
            key={`picker-month-${monthIndex}-${monthDate.getFullYear()}-${monthDate.getMonth()}`}
            monthDate={monthDate}
            today={today}
            fromDate={fromDate}
            toDate={toDate}
            weekdayLabels={weekdayLabels}
            compact={isMobile}
            onPrevMonth={() => moveMonth(-1)}
            onNextMonth={() => moveMonth(1)}
            onDatePick={handleDatePick}
          />
        ))}
      </div>
    </>
  )

  const panelFooter = (
    <div className="flex items-center justify-between gap-3 border-t border-outline-variant/15 px-4 py-3">
      <button
        type="button"
        onClick={handleClear}
        className="text-label-sm font-medium text-on-surface-variant hover:text-tertiary"
      >
        {clearLabel}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-full bg-primary px-4 py-2 text-label-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        {doneLabel}
      </button>
    </div>
  )

  const portaledPanel =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            {isMobile && (
              <button
                type="button"
                aria-label={doneLabel}
                className="fixed inset-0 z-[99998] bg-black/45"
                onClick={() => setOpen(false)}
              />
            )}
            <div
              ref={panelRef}
              role="dialog"
              aria-label={label}
              style={isMobile ? undefined : panelStyle}
              className={cn(
                panelClassName,
                'flex flex-col',
                isMobile
                  ? 'fixed inset-x-3 bottom-3 z-[99999] max-h-[min(88dvh,720px)] overflow-hidden shadow-2xl sm:inset-x-4'
                  : 'overflow-visible',
              )}
            >
              <div
                className={cn(
                  'p-4',
                  isMobile && 'min-h-0 flex-1 overflow-y-auto overscroll-contain',
                  !isMobile && panelStyle.maxHeight && 'overflow-y-auto overscroll-contain',
                )}
              >
                {panelContent}
              </div>
              {panelFooter}
            </div>
          </>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className="relative flex w-full min-w-0 flex-col gap-2">
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <div className="relative w-full">
        <Calendar
          size={20}
          strokeWidth={1.75}
          className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${iconClassName}`}
          aria-hidden
        />
        <button
          ref={triggerRef}
          id={id}
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={`${triggerClassName} whitespace-nowrap overflow-hidden text-ellipsis text-left`}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          {displayValue}
        </button>
        {(periodFrom || periodTo) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/80 hover:text-on-surface"
            aria-label={clearLabel}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {portaledPanel}
    </div>
  )
}

export default DateRangePickerField
