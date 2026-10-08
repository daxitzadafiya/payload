import type { Metadata } from 'next'
import React from 'react'

import { DocumentDownloadReady } from '@/components/DocumentDownload/DocumentDownloadReady'
import { getActiveLocale } from '@/i18n/getLanguageMenu'
import { resolveDocumentDownloadLink } from '@/utilities/documentDownloadToken'
import { getServerSideURL } from '@/utilities/getURL'
import { t } from '@/utilities/translate'

type Args = {
  params: Promise<{
    token: string
  }>
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

function sameSiteReturnUrl(pageUrl: string | undefined): string | undefined {
  if (!pageUrl) return undefined
  try {
    const page = new URL(pageUrl)
    const site = new URL(getServerSideURL())
    if (page.protocol !== 'http:' && page.protocol !== 'https:') return undefined
    if (page.hostname !== site.hostname) return undefined
    return page.toString()
  } catch {
    return undefined
  }
}

export default async function DocumentDownloadPage({ params: paramsPromise }: Args) {
  const { token } = await paramsPromise
  const { locale } = await getActiveLocale()
  const grant = await resolveDocumentDownloadLink(token)

  if (grant.status === 'valid') {
    const [title, body, buttonLabel] = await Promise.all([
      t('downloadLink.ready.title', locale, 'Your download is starting'),
      t(
        'downloadLink.ready.body',
        locale,
        'If the file does not start downloading, use the button below. This link expires 30 minutes after the email was sent.',
      ),
      t('downloadLink.ready.button', locale, 'Download document'),
    ])

    return (
      <DocumentDownloadReady
        token={token}
        title={title}
        body={body}
        buttonLabel={buttonLabel}
      />
    )
  }

  const [title, body, buttonLabel] = await Promise.all([
    t('downloadLink.invalid.title', locale, 'This download link is no longer valid'),
    t(
      'downloadLink.invalid.body',
      locale,
      'This link has expired or is not valid. Download links last for 30 minutes. Please request the document again to receive a new link.',
    ),
    t('downloadLink.invalid.button', locale, 'Request a new download'),
  ])
  const returnUrl = grant.status === 'expired' ? sameSiteReturnUrl(grant.pageUrl) : undefined

  return (
    <main className="bg-surface-cream px-margin-mobile py-28 md:px-margin-desktop md:py-36">
      <div className="mx-auto max-w-xl rounded-[1.75rem] border border-secondary/30 bg-surface-container-lowest px-8 py-12 text-center shadow-[0_28px_60px_-36px_rgba(0,0,0,0.28)]">
        <span className="mx-auto mb-6 block h-px w-12 bg-secondary" aria-hidden />
        <h1 className="m-0 font-headline-lg text-[clamp(1.8rem,3vw,2.4rem)] font-light leading-tight text-primary">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body-md text-[15px] font-light leading-relaxed text-on-surface/75">
          {body}
        </p>
        {returnUrl ? (
          <a
            href={returnUrl}
            className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-md bg-secondary px-6 py-3 font-label-nav text-[11px] uppercase tracking-[0.14em] text-on-secondary transition-opacity hover:opacity-90"
          >
            {buttonLabel}
          </a>
        ) : null}
      </div>
    </main>
  )
}
