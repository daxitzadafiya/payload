import Link from 'next/link'
import React from 'react'

import { Button } from '@/components/ui/button'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { t } from '@/utilities/translate'

export default async function NotFound() {
  const { locale } = await getActiveLocale()
  const message = await t('notFound.message', locale, 'This page could not be found.')
  const goHomeLabel = await t('notFound.goHome', locale, 'Go home')

  return (
    <div className="container py-28">
      <div className="prose max-w-none">
        <h1 style={{ marginBottom: 0 }}>404</h1>
        <p className="mb-4">{message}</p>
      </div>
      <Button asChild variant="default">
        <Link href="/">{goHomeLabel}</Link>
      </Button>
    </div>
  )
}
