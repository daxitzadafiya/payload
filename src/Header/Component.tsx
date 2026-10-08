import { HeaderClient } from './Component.client'
import { getLogoSources } from '@/components/Logo/getLogoSources'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

export async function Header() {
  const { locale, languageMenu } = await getActiveLocale()
  const [headerData, logoData] = await Promise.all([
    getCachedGlobal('header', 1, locale)(),
    getCachedGlobal('logo', 1)(),
  ])

  return (
    <HeaderClient
      data={headerData}
      locale={locale}
      languageMenu={languageMenu}
      logoSources={getLogoSources(logoData)}
    />
  )
}
