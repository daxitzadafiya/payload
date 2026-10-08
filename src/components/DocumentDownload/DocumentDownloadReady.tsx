'use client'

import React, { useEffect } from 'react'

type Props = {
  token: string
  title: string
  body: string
  buttonLabel: string
}

export const DocumentDownloadReady: React.FC<Props> = ({
  token,
  title,
  body,
  buttonLabel,
}) => {
  const fileHref = `/download/${encodeURIComponent(token)}/file`

  // Start the download without navigating the tab away from this page.
  // A plain <a>.click() replaces the URL with /file and, when the proxy fails,
  // leaves the visitor on an error/blank page with no obvious retry.
  useEffect(() => {
    const iframe = document.createElement('iframe')
    iframe.src = fileHref
    iframe.title = 'Document download'
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.position = 'fixed'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.style.opacity = '0'
    iframe.style.pointerEvents = 'none'
    document.body.appendChild(iframe)

    return () => {
      iframe.remove()
    }
  }, [fileHref])

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
        <a
          href={fileHref}
          className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-md bg-secondary px-6 py-3 font-label-nav text-[11px] uppercase tracking-[0.14em] text-on-secondary transition-opacity hover:opacity-90"
        >
          {buttonLabel}
        </a>
      </div>
    </main>
  )
}
