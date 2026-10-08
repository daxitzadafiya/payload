/** Guest-facing check-in / check-out wall clock (Europe/Athens). */
export const HOLIDAY_CHECK_IN_HOUR = 15
export const HOLIDAY_CHECK_OUT_HOUR = 11
export const HOLIDAY_STAY_TIMEZONE = 'Europe/Athens'

const parseDateKeyParts = (
  value: string,
): { year: number; month: number; day: number; ymd: string } | undefined => {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return undefined
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  return { year, month, day, ymd: `${match[1]}-${match[2]}-${match[3]}` }
}

/** Offset (ms) of `timeZone` at the given UTC instant: zonedLocalAsUtc - utcInstant. */
const getTimeZoneOffsetMs = (utcInstantMs: number, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(utcInstantMs))

  const pick = (type: string): number => {
    const part = parts.find((entry) => entry.type === type)?.value
    return Number(part)
  }

  const asUtcFromParts = Date.UTC(
    pick('year'),
    pick('month') - 1,
    pick('day'),
    pick('hour'),
    pick('minute'),
    pick('second'),
  )
  return asUtcFromParts - utcInstantMs
}

/**
 * Convert a calendar date + local wall time in `timeZone` to Unix seconds.
 * Two-pass offset fix handles DST correctly for Europe/Athens.
 */
export function dateKeyToUnixSecondsAt(
  value: string,
  hour: number,
  minute = 0,
  timeZone: string = HOLIDAY_STAY_TIMEZONE,
): number | undefined {
  const parts = parseDateKeyParts(value)
  if (!parts) return undefined

  const asUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0)
  const offset1 = getTimeZoneOffsetMs(asUtcMs, timeZone)
  let instant = asUtcMs - offset1
  const offset2 = getTimeZoneOffsetMs(instant, timeZone)
  instant = asUtcMs - offset2

  if (!Number.isFinite(instant)) return undefined
  return Math.floor(instant / 1000)
}

/** Check-in: date key at {@link HOLIDAY_CHECK_IN_HOUR}:00 in {@link HOLIDAY_STAY_TIMEZONE}. */
export function arrivalDateKeyToUnixSeconds(value: string): number | undefined {
  return dateKeyToUnixSecondsAt(value, HOLIDAY_CHECK_IN_HOUR)
}

/** Check-out: date key at {@link HOLIDAY_CHECK_OUT_HOUR}:00 in {@link HOLIDAY_STAY_TIMEZONE}. */
export function departureDateKeyToUnixSeconds(value: string): number | undefined {
  return dateKeyToUnixSecondsAt(value, HOLIDAY_CHECK_OUT_HOUR)
}

/** Treat `YYYY-MM-DD` as UTC midnight (stable listing / date-key conversion). */
export function dateKeyToUnixSeconds(value: string): number | undefined {
  const parts = parseDateKeyParts(value)
  if (!parts) return undefined
  const parsed = Date.parse(`${parts.ymd}T00:00:00Z`)
  if (!Number.isFinite(parsed)) return undefined
  return Math.floor(parsed / 1000)
}
