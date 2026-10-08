import { NextResponse } from 'next/server'

import { getLocale } from '@/i18n/getLocale'
import { t } from '@/utilities/translate'

type TranslationItem = {
  key?: string
  fallback?: string
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    key?: string
    language?: string
    fallback?: string
    items?: TranslationItem[]
  }

  const language = (body.language ?? (await getLocale())).trim()

  if (Array.isArray(body.items) && body.items.length > 0) {
    const translations: Record<string, string> = {}

    await Promise.all(
      body.items.map(async (item) => {
        const key = item.key?.trim()
        if (!key) return

        translations[key] = await t(key, language, item.fallback ?? '')
      }),
    )

    return NextResponse.json({ translations })
  }

  const key = body.key?.trim()
  const fallback = body.fallback ?? ''

  if (!key) {
    return NextResponse.json({ error: 'Missing translation key' }, { status: 400 })
  }

  try {
    const text = await t(key, language, fallback)
    return NextResponse.json({ text, translations: { [key]: text } })
  } catch (error) {
    console.error('Translation API error:', error)
    return NextResponse.json({ text: fallback, translations: { [key]: fallback } })
  }
}
