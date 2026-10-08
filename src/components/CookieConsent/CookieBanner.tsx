'use client'

import { X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { CMSLink, type CMSLinkType } from '@/components/Link'
import RichText from '@/components/RichText'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { cn } from '@/utilities/ui'

import { getConsentCookie, setConsentCookie, type ConsentValue } from './cookieStorage'

function isDismissedForSession(storageKey: string): boolean {
  try {
    return sessionStorage.getItem(`${storageKey}-dismissed`) === '1'
  } catch {
    return false
  }
}

function dismissForSession(storageKey: string): void {
  try {
    sessionStorage.setItem(`${storageKey}-dismissed`, '1')
  } catch {
    // ignore
  }
}

export type CookieBannerProps = {
  acceptLabel: string
  content?: DefaultTypedEditorState | null
  enabled: boolean
  expiryDays: number
  policyLink?: CMSLinkType | null
  rejectLabel?: string | null
  showCloseButton?: boolean | null
  storageKey: string
  title?: string | null
}

const buttonClass = cn(
  'rounded-full font-label-nav text-[11px] uppercase tracking-[0.12em] cursor-pointer',
  'px-4 py-2 sm:px-5 sm:py-2.5',
)

export const CookieBanner: React.FC<CookieBannerProps> = ({
  acceptLabel,
  content,
  enabled,
  expiryDays,
  policyLink,
  rejectLabel,
  showCloseButton = true,
  storageKey,
  title,
}) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const existing = getConsentCookie(storageKey)
    if (!existing && !isDismissedForSession(storageKey)) {
      setVisible(true)
    }
  }, [enabled, storageKey])

  const saveChoice = (value: ConsentValue) => {
    setConsentCookie(storageKey, value, expiryDays)
    setVisible(false)
  }

  const handleClose = () => {
    dismissForSession(storageKey)
    setVisible(false)
  }

  if (!enabled || !visible) {
    return null
  }

  const showReject = Boolean(rejectLabel?.trim())
  const hasPolicyLink = Boolean(policyLink?.url || policyLink?.reference)

  return (
    <div
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-100 border-t border-outline-variant/30 bg-surface-container-lowest shadow-[0_-2px_16px_rgba(0,0,0,0.08)]"
      role="region"
    >
      <div className="relative mx-auto max-w-max-width px-4 md:px-margin-desktop py-3 md:py-4">
        {showCloseButton && (
          <button
            aria-label="Close"
            className="absolute right-4 top-3 md:right-margin-desktop p-0.5 text-on-surface-variant transition-colors hover:text-on-surface"
            onClick={handleClose}
            type="button"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6 md:pr-8">
          <div className="min-w-0 flex-1 space-y-1 pr-6 md:pr-0">
            {title ? (
              <h2
                className="text-base font-headline-sm text-on-surface font-semibold leading-tight"
                id="cookie-consent-title"
              >
                {title}
              </h2>
            ) : (
              <span id="cookie-consent-title" className="sr-only">
                Cookie consent
              </span>
            )}

            {content && (
              <div
                className={cn(
                  'text-xs sm:text-sm text-on-surface-variant leading-snug',
                  'line-clamp-3 md:line-clamp-2',
                  '[&_p]:leading-snug [&_p:not(:last-child)]:mb-1',
                  '[&_a]:text-tertiary [&_a]:underline [&_a]:underline-offset-2',
                )}
              >
                <RichText data={content} enableGutter={false} />
              </div>
            )}

            {hasPolicyLink && (
              <CMSLink
                {...policyLink}
                appearance="inline"
                className="inline-block font-label-sm text-[10px] text-tertiary uppercase tracking-[0.12em] underline underline-offset-2 hover:opacity-80 md:hidden"
                label={policyLink?.label}
              />
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {hasPolicyLink && (
              <CMSLink
                {...policyLink}
                appearance="inline"
                className="hidden font-label-sm text-[10px] text-tertiary uppercase tracking-[0.12em] underline underline-offset-2 hover:opacity-80 md:inline-block md:mr-1"
                label={policyLink?.label}
              />
            )}

            <div className="flex gap-2 sm:gap-2.5">
              {showReject && (
                <button
                  className={cn(
                    buttonClass,
                    'border border-primary bg-transparent text-primary hover:bg-primary/5',
                  )}
                  onClick={() => saveChoice('rejected')}
                  type="button"
                >
                  {rejectLabel}
                </button>
              )}
              <button
                className={cn(
                  buttonClass,
                  'bg-primary text-on-primary shadow-sm hover:opacity-90',
                )}
                onClick={() => saveChoice('accepted')}
                type="button"
              >
                {acceptLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
