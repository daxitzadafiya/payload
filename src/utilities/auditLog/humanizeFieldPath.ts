/**
 * Turn dotted field paths into readable labels for the activity log UI.
 * e.g. layout.0.listingPreset → Layout › #1 › Listing Preset
 */
export function humanizeFieldPath(path: string): string {
  if (!path) return 'Unknown field'

  return path
    .split('.')
    .map((segment) => {
      if (/^\d+$/.test(segment)) return `#${Number(segment) + 1}`
      if (segment === '_status') return 'Status'
      if (segment === 'id') return 'ID'

      const spaced = segment
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .trim()

      return spaced.replace(/\b\w/g, (c) => c.toUpperCase())
    })
    .join(' › ')
}

export function truncateValue(value: string | null | undefined, max = 80): string {
  if (value == null || value === '') return '—'
  const single = value.replace(/\s+/g, ' ').trim()
  if (single.length <= max) return single
  return `${single.slice(0, max - 1)}…`
}

export function buildChangesSummary(
  changes: { field: string; oldValue?: string | null; newValue?: string | null }[],
  maxItems = 2,
): string {
  if (!changes.length) return 'No field changes'

  const parts = changes.slice(0, maxItems).map((c) => {
    const label = humanizeFieldPath(c.field)
    const from = truncateValue(c.oldValue, 36)
    const to = truncateValue(c.newValue, 36)
    return `${label}: ${from} → ${to}`
  })

  const extra = changes.length - maxItems
  if (extra > 0) parts.push(`+${extra} more`)
  return parts.join(' · ')
}
