const LOCALE_TO_COUNTRY: Record<string, string> = {
  en: 'gb',
  de: 'de',
  el: 'gr',
  fr: 'fr',
  es: 'es',
  pt: 'pt',
  it: 'it',
  nl: 'nl',
}

/** Map site locale to a default ISO country code for the phone picker. */
export function resolveDefaultPhoneCountry(locale: string): string {
  const base = locale.split('-')[0]?.trim().toLowerCase() || 'en'
  return LOCALE_TO_COUNTRY[base] ?? 'de'
}

/** react-phone-input-2 stores digits with country code and no "+" prefix. */
export function normalizePhoneInputValue(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ''
  return trimmed.startsWith('+') ? trimmed.slice(1) : trimmed
}

export function formatPhoneE164(value: string | null | undefined): string {
  const normalized = normalizePhoneInputValue(value)
  if (!normalized) return ''
  return `+${normalized}`
}

/** E.164 allows up to 15 digits; require a plausible national number after the dial code. */
export function isValidPhoneValue(value: string | null | undefined): boolean {
  const digits = normalizePhoneInputValue(value).replace(/\D/g, '')
  if (!digits) return false
  if (digits.length < 8 || digits.length > 15) return false

  // Reject values that are only a country dial code (1–3 digits).
  if (digits.length <= 3) return false

  return true
}

/** Used by react-phone-input-2's `isValid` prop for inline feedback. */
export function validatePhoneInputValue(
  value: string,
  country: { dialCode?: string },
): boolean {
  const digits = value.replace(/\D/g, '')
  if (!digits) return false

  const dialCode = country.dialCode ?? ''
  if (dialCode && !digits.startsWith(dialCode)) return false

  const nationalDigits = digits.slice(dialCode.length)
  if (nationalDigits.length < 4) return false

  return isValidPhoneValue(digits)
}
