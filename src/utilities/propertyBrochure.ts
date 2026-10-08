import { resolveOptimaCrmSettings } from '@/settings/optimaCrm/client'

/** Maps site locale to Optima PDF `lang` param (e.g. EN, ES). */
export function mapLocaleToBrochurePdfLang(locale: string): string {
  const language = (locale || 'en').trim().toLowerCase().split(/[-_]/)[0]
  const pdfLangMap: Record<string, string> = {
    en: 'EN',
    es: 'ES',
    fr: 'FR',
    de: 'DE',
    el: 'EL',
    it: 'IT',
    nl: 'NL',
    pt: 'PT',
    ru: 'RU',
    da: 'DA',
    sv: 'SV',
    pl: 'PL',
  }

  return pdfLangMap[language] ?? language.toUpperCase()
}

const pickModelId = (property: Record<string, unknown>): string | undefined => {
  const candidates = [property._id, property.id]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate)
  }

  return undefined
}

/**
 * Optima Yii PDF brochure URL:
 * {contactUrl}?r=pdf&user={userKey}&template_id={templateId}&modelId={_id}&lang=EN&model_name=commercial_properties
 */
export function buildPropertyBrochurePdfUrl(
  property: Record<string, unknown>,
  locale: string,
): string | undefined {
  const settings = resolveOptimaCrmSettings()

  const contactBase = settings.contactUrl.trim()
  const userKey = settings.userKey.trim()
  const templateId = settings.brochureTemplateId.trim()
  const modelId = pickModelId(property)

  if (!contactBase || !userKey || !templateId || !modelId) return undefined

  try {
    const url = new URL(contactBase)
    url.searchParams.set('r', 'pdf')
    url.searchParams.set('user', userKey)
    url.searchParams.set('template_id', templateId)
    url.searchParams.set('modelId', modelId)
    url.searchParams.set('lang', mapLocaleToBrochurePdfLang(locale))
    url.searchParams.set('model_name', 'commercial_properties')
    return url.toString()
  } catch {
    return undefined
  }
}
