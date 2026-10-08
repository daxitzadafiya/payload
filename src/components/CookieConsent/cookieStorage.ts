export type ConsentValue = 'accepted' | 'rejected'

export function getConsentCookie(name: string): ConsentValue | null {
  if (typeof document === 'undefined') return null

  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  const value = match?.[1]

  if (value === 'accepted' || value === 'rejected') {
    return value
  }

  return null
}

export function setConsentCookie(name: string, value: ConsentValue, expiryDays: number): void {
  const maxAge = Math.max(1, expiryDays) * 24 * 60 * 60
  document.cookie = `${encodeURIComponent(name)}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
}
