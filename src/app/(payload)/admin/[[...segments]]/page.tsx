/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { getPayload } from 'payload'
import { importMap } from '../importMap'
import { syncAdminLanguagesFromLocalization } from '@/i18n/syncAdminLanguagesFromLocalization'
import { ensureAdminI18nSynced } from '@/utilities/adminI18n'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = async ({ params, searchParams }: Args) => {
  // Keep Account → Language options aligned with Globals → Localization (HMR-safe),
  // then wait for admin.* translation seed so labels resolve for the Account Language.
  try {
    const payload = await getPayload({ config })
    const adminLanguageCodes = await syncAdminLanguagesFromLocalization(payload)
    await ensureAdminI18nSynced(payload, { locales: adminLanguageCodes })
  } catch {
    // ignore — admin still renders; labels fall back to English
  }

  return RootPage({ config, params, searchParams, importMap })
}

export default Page
