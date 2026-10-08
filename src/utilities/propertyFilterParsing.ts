/** Shared filter parsing helpers — no imports from crmProperties (safe for API routes). */

export const COUNT_FILTER_OTHER_VALUE = 'other'

const HOLIDAY_BUDGET_OPTIONS = [
  { value: 'any', min: 'any', max: 'any' },
  { value: '0-500', min: '0', max: '500' },
  { value: '500-1000', min: '500', max: '1000' },
  { value: '1000-2500', min: '1000', max: '2500' },
  { value: '2500-5000', min: '2500', max: '5000' },
  { value: '5000+', min: '5000', max: 'any' },
] as const

/** Resolves a bedrooms/bathrooms dropdown (+ optional custom) to a CRM integer count. */
export const parseCountFilterValue = (value?: string, custom?: string): number | undefined => {
  if (!value || value === 'any') return undefined

  if (value === COUNT_FILTER_OTHER_VALUE) {
    const parsed = parseInt(custom?.replace(/\D/g, '') ?? '', 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }

  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const applyHolidayBudgetValue = (range: string): { minBudget: string; maxBudget: string } => {
  const match = HOLIDAY_BUDGET_OPTIONS.find((opt) => opt.value === range)
  if (!match) return { minBudget: 'any', maxBudget: 'any' }
  return { minBudget: match.min, maxBudget: match.max }
}

export const resolveHolidayBudgetRange = (totalBudget?: string): [number, number] | undefined => {
  if (!totalBudget || totalBudget === 'any') return undefined
  const { minBudget, maxBudget } = applyHolidayBudgetValue(totalBudget)
  if (minBudget !== 'any' || maxBudget !== 'any') {
    const min = minBudget === 'any' ? 0 : Number(minBudget)
    const max = maxBudget === 'any' ? 999_999_999 : Number(maxBudget)
    if (Number.isFinite(min) && Number.isFinite(max)) return [min, max]
  }

  // Fallback for CMS-provided values like "€1,000 - €2,500", "5000+", "Up to €500".
  const normalized = totalBudget.toLowerCase().trim()
  const numericTokens = normalized.match(/\d[\d,.]*/g) ?? []
  const numbers = numericTokens
    .map((token) => Number(token.replace(/[^\d]/g, '')))
    .filter((num) => Number.isFinite(num) && num >= 0)

  if (numbers.length >= 2) {
    const min = Math.min(numbers[0], numbers[1])
    const max = Math.max(numbers[0], numbers[1])
    return [min, max]
  }

  if (numbers.length === 1) {
    const amount = numbers[0]
    if (normalized.includes('+')) return [amount, 999_999_999]
    if (normalized.includes('up to') || normalized.includes('max')) return [0, amount]
    return [amount, 999_999_999]
  }

  return undefined
}
