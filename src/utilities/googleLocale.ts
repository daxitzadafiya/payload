/**
 * Normalize the active site locale for Google services (Maps embed, reCAPTCHA `hl`).
 * CMS locale codes match Google's supported language codes.
 */
export function toGoogleHl(locale: string, fallback = 'en'): string {
  const code = locale.trim().toLowerCase()
  return code || fallback
}

/** Replace/append map language params on a Google Maps embed URL. */
export function withGoogleMapLocale(url: string, locale: string): string {
  const hl = toGoogleHl(locale)
  const encHl = encodeURIComponent(hl)

  // Prefer URL parsing when possible.
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('hl', hl)
    parsed.searchParams.set('language', hl)
    return parsed.toString()
  } catch {
    // Fallback for non-standard URLs: do string param replacement.
    const replaceParam = (paramName: string) => {
      const re = new RegExp(`([?&])${paramName}=[^&#]*`, 'i')
      if (re.test(url)) {
        return url.replace(re, `$1${paramName}=${encHl}`)
      }
      return url
    }

    let next = url
    // Replace if already present.
    next = replaceParam('hl')
    next = replaceParam('language')

    const hasHl = /([?&])hl=/.test(next)
    const hasLanguage = /([?&])language=/.test(next)

    const separator = next.includes('?') ? '&' : '?'
    if (!hasHl && !hasLanguage) {
      return `${next}${separator}hl=${encHl}&language=${encHl}`
    }
    if (!hasHl) return `${next}${separator}hl=${encHl}`
    if (!hasLanguage) return `${next}${separator}language=${encHl}`
    return next
  }
}
