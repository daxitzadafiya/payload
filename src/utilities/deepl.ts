import { getDeepLSettings, type ResolvedDeepLSettings } from '@/settings/deepl/server'

/** DeepL target/source language codes (uppercase) mapped from site locale codes */
const DEEPL_LOCALE_MAP: Record<string, string> = {
  en: 'EN',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  nl: 'NL',
  el: 'EL',
  fi: 'FI',
}

function resolveDeepLLocale(locale: string): string | null {
  const normalized = locale.trim().toLowerCase()
  return DEEPL_LOCALE_MAP[normalized] ?? null
}

type DeepLTranslateResponse = {
  translations?: Array<{ text?: string }>
}

const DEEPL_BATCH_LIMIT = 100

/**
 * Translate text via the DeepL API.
 * Returns null when the API is unavailable, misconfigured, or the request fails.
 */
export async function translateWithDeepL(
  text: string,
  targetLanguage: string,
  sourceLanguage = 'en',
  settings?: ResolvedDeepLSettings,
): Promise<string | null> {
  const [result] = await translateManyWithDeepL([text], targetLanguage, sourceLanguage, settings)
  return result
}

/**
 * Translate many strings in one or more batched DeepL requests (same target language).
 * Returns one entry per input (null when that string failed / was empty).
 */
export async function translateManyWithDeepL(
  texts: string[],
  targetLanguage: string,
  sourceLanguage = 'en',
  settings?: ResolvedDeepLSettings,
): Promise<Array<string | null>> {
  if (texts.length === 0) return []

  const resolvedSettings = settings ?? (await getDeepLSettings())
  if (!resolvedSettings.enabled) return texts.map(() => null)

  const apiKey = resolvedSettings.apiKey.trim()
  if (!apiKey) {
    console.warn('[deepl] DeepL API key is not configured')
    return texts.map(() => null)
  }

  const targetLang = resolveDeepLLocale(targetLanguage)
  if (!targetLang) {
    console.warn(`[deepl] Unsupported target language: ${targetLanguage}`)
    return texts.map(() => null)
  }

  const sourceLang = resolveDeepLLocale(sourceLanguage) ?? 'EN'
  if (targetLang === sourceLang) {
    return texts.map((text) => {
      const trimmed = text.trim()
      return trimmed || null
    })
  }

  const apiUrl = resolvedSettings.apiUrl.trim() || 'https://api.deepl.com'
  const results: Array<string | null> = new Array(texts.length).fill(null)

  for (let offset = 0; offset < texts.length; offset += DEEPL_BATCH_LIMIT) {
    const slice = texts.slice(offset, offset + DEEPL_BATCH_LIMIT)
    const indexMap: number[] = []
    const body = new URLSearchParams({
      target_lang: targetLang,
      source_lang: sourceLang,
    })

    for (let i = 0; i < slice.length; i += 1) {
      const trimmed = slice[i]?.trim() ?? ''
      if (!trimmed) continue
      body.append('text', trimmed)
      indexMap.push(offset + i)
    }

    if (indexMap.length === 0) continue

    try {
      const response = await fetch(`${apiUrl}/v2/translate`, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`[deepl] API error ${response.status}: ${errorBody}`)
        continue
      }

      const data = (await response.json()) as DeepLTranslateResponse
      const translations = data.translations ?? []
      for (let i = 0; i < indexMap.length; i += 1) {
        const translated = translations[i]?.text?.trim()
        results[indexMap[i]!] = translated || null
      }
    } catch (error) {
      console.error('[deepl] Request failed:', error)
    }
  }

  return results
}
