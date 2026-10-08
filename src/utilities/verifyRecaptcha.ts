/**
 * Minimal reCAPTCHA v2 token verification for server-side enforcement.
 * Secret key is loaded from Globals → Integrations.
 */
import { getIntegrationsSettings } from '@/settings/integrations/server'

export async function verifyRecaptchaToken({
  token,
  remoteip,
}: {
  token: string
  remoteip?: string
}): Promise<boolean> {
  const settings = await getIntegrationsSettings()
  const secret = settings.recaptchaSecretKey.trim()

  if (!secret) {
    throw new Error('reCAPTCHA secret key is not configured on the server.')
  }

  const params = new URLSearchParams({
    secret,
    response: token,
    ...(remoteip ? { remoteip } : {}),
  })

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
    },
    body: params.toString(),
  })

  const json: any = await res.json().catch(() => ({}))
  if (!res.ok) return false
  return Boolean(json?.success)
}
