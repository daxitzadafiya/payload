/** Max fraction digits for property and project prices. */
export const PRICE_FRACTION_DIGITS = 2

/**
 * Format a numeric price for display.
 * Shows up to two decimals when needed; omits trailing `.00`
 * (e.g. 45.56 → "45.56", 56 → "56", 1100 → "1,100").
 */
export function formatPriceAmount(
  value: number,
  maxFractionDigits = PRICE_FRACTION_DIGITS,
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: maxFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  }).format(value)

  if (maxFractionDigits <= 0) return formatted
  return formatted.replace(/\.00$/u, '')
}
