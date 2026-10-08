import type { IntegrationsSetting } from '@/payload-types'

export type WhatsAppPosition = 'left' | 'right'

export type PublicWhatsAppSettings = {
  enabled: boolean
  phoneNumber: string
  position: WhatsAppPosition
  /** Digits-only number for https://wa.me/{digits} */
  waMeUrl: string | null
}

export type PublicVirtualAssistantSettings = {
  enabled: boolean
  scriptSrc: string
  agencyKey: string
}

export type ResolvedIntegrationsSettings = {
  googleMapsApiKey: string
  recaptchaSiteKey: string
  recaptchaSecretKey: string
  whatsapp: PublicWhatsAppSettings
  virtualAssistant: PublicVirtualAssistantSettings
}

export type PublicIntegrationsSettings = Pick<
  ResolvedIntegrationsSettings,
  'googleMapsApiKey' | 'recaptchaSiteKey' | 'whatsapp' | 'virtualAssistant'
>

export const EMPTY_WHATSAPP_SETTINGS: PublicWhatsAppSettings = {
  enabled: false,
  phoneNumber: '',
  position: 'right',
  waMeUrl: null,
}

export const EMPTY_VIRTUAL_ASSISTANT_SETTINGS: PublicVirtualAssistantSettings = {
  enabled: false,
  scriptSrc: '',
  agencyKey: '',
}

export const EMPTY_INTEGRATIONS_SETTINGS: ResolvedIntegrationsSettings = {
  googleMapsApiKey: '',
  recaptchaSiteKey: '',
  recaptchaSecretKey: '',
  whatsapp: EMPTY_WHATSAPP_SETTINGS,
  virtualAssistant: EMPTY_VIRTUAL_ASSISTANT_SETTINGS,
}

function pickString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

/** Normalize to digits only for wa.me (strips +, spaces, dashes). */
export function normalizeWhatsAppPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function buildWhatsAppMeUrl(phone: string): string | null {
  const digits = normalizeWhatsAppPhone(phone)
  if (!digits) return null
  return `https://wa.me/${digits}`
}

/**
 * Parse an Optima webchat embed tag into src + agency key.
 * Example: <script src="https://webchat-api.optimasit.com/widget.js" data-agency-key="…" async></script>
 */
export function parseVirtualAssistantEmbedScript(raw: string): {
  scriptSrc: string
  agencyKey: string
} | null {
  const text = raw.trim()
  if (!text) return null

  const srcMatch = text.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
  const agencyMatch = text.match(/\bdata-agency-key\s*=\s*["']([^"']+)["']/i)
  const scriptSrc = srcMatch?.[1]?.trim() ?? ''
  const agencyKey = agencyMatch?.[1]?.trim() ?? ''

  if (!scriptSrc || !agencyKey) return null
  if (!/^https:\/\//i.test(scriptSrc)) return null

  return { scriptSrc, agencyKey }
}

export function resolveWhatsAppSettings(
  whatsapp: IntegrationsSetting['whatsapp'] | null | undefined,
): PublicWhatsAppSettings {
  const phoneNumber = pickString(whatsapp?.phoneNumber, '')
  const position = whatsapp?.position === 'left' ? 'left' : 'right'
  const enabled = whatsapp?.enabled === true && Boolean(normalizeWhatsAppPhone(phoneNumber))

  return {
    enabled,
    phoneNumber,
    position,
    waMeUrl: enabled ? buildWhatsAppMeUrl(phoneNumber) : null,
  }
}

export function resolveVirtualAssistantSettings(
  virtualAssistant: IntegrationsSetting['virtualAssistant'] | null | undefined,
): PublicVirtualAssistantSettings {
  const embedScript = pickString(virtualAssistant?.embedScript, '')
  const parsed = parseVirtualAssistantEmbedScript(embedScript)
  const enabled = virtualAssistant?.enabled === true && parsed !== null

  return {
    enabled,
    scriptSrc: enabled && parsed ? parsed.scriptSrc : '',
    agencyKey: enabled && parsed ? parsed.agencyKey : '',
  }
}

export function resolveIntegrationsSettingsFromGlobal(
  doc: IntegrationsSetting | null | undefined,
): ResolvedIntegrationsSettings {
  const googleMaps = doc?.googleMaps
  const recaptcha = doc?.recaptcha
  const defaults = EMPTY_INTEGRATIONS_SETTINGS

  return {
    googleMapsApiKey: pickString(googleMaps?.apiKey, defaults.googleMapsApiKey),
    recaptchaSiteKey: pickString(recaptcha?.siteKey, defaults.recaptchaSiteKey),
    recaptchaSecretKey: pickString(recaptcha?.secretKey, defaults.recaptchaSecretKey),
    whatsapp: resolveWhatsAppSettings(doc?.whatsapp),
    virtualAssistant: resolveVirtualAssistantSettings(doc?.virtualAssistant),
  }
}

export function toPublicIntegrationsSettings(
  settings: ResolvedIntegrationsSettings,
): PublicIntegrationsSettings {
  return {
    googleMapsApiKey: settings.googleMapsApiKey,
    recaptchaSiteKey: settings.recaptchaSiteKey,
    whatsapp: settings.whatsapp,
    virtualAssistant: settings.virtualAssistant,
  }
}
