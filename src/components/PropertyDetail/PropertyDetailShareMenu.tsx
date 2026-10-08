'use client'

import { Mail, MessageCircle, Share2 } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useTranslation } from '@/utilities/translateClient'

type ShareChannel = 'facebook' | 'whatsapp' | 'email'

type ShareLink = {
  id: ShareChannel
  label: string
  href: string
}

function getPageUrl(): string {
  if (typeof window === 'undefined') return ''
  return window.location.href
}

function buildShareLinks(
  pageUrl: string,
  labels: Record<ShareChannel, string>,
): ShareLink[] {
  const encodedUrl = encodeURIComponent(pageUrl)

  return [
    {
      id: 'facebook',
      label: labels.facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: 'whatsapp',
      label: labels.whatsapp,
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`\n${pageUrl}`)}`,
    },
    {
      id: 'email',
      label: labels.email,
      href: `mailto:?body=${encodedUrl}`,
    },
  ]
}

export const PropertyDetailShareMenu: React.FC = () => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const sharePropertyAria = useTranslation('propertyDetail.share.aria', 'Share property')
  const shareToYourLabel = useTranslation('propertyDetail.share.shareToYour', 'Share to your')
  const facebookLabel = useTranslation('propertyDetail.share.facebook', 'Facebook')
  const whatsappLabel = useTranslation('propertyDetail.share.whatsapp', 'WhatsApp')
  const emailLabel = useTranslation('propertyDetail.share.email', 'Email')

  const channelLabels = useMemo(
    () => ({
      facebook: facebookLabel,
      whatsapp: whatsappLabel,
      email: emailLabel,
    }),
    [emailLabel, facebookLabel, whatsappLabel],
  )

  const pageUrl = open ? getPageUrl() : ''
  const shareLinks = pageUrl ? buildShareLinks(pageUrl, channelLabels) : []

  const closeMenu = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu()
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [closeMenu, open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={sharePropertyAria}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-[50px] w-[50px] cursor-pointer items-center justify-center rounded-md border border-secondary/45 bg-transparent text-secondary transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-on-secondary sm:h-[52px] sm:w-[52px]"
      >
        <Share2 size={18} strokeWidth={1.6} />
      </button>

      {open && shareLinks.length > 0 && (
        <div
          role="menu"
          aria-label={sharePropertyAria}
          className="absolute bottom-full right-0 z-30 mb-3 w-56 overflow-hidden rounded-md border border-secondary/30 bg-surface-cream text-primary shadow-[0_20px_48px_-24px_rgba(0,0,0,0.35)]"
        >
          <p className="px-4 pt-4 pb-3 font-label-nav text-[10px] uppercase tracking-[0.18em] text-secondary">
            {shareToYourLabel}
          </p>
          <div className="mx-4 h-px bg-secondary/25" />
          <ul className="py-1.5">
            {shareLinks.map((channel) => (
              <li key={channel.id}>
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  onClick={closeMenu}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left font-label-nav text-[11px] uppercase tracking-[0.12em] text-primary no-underline transition-colors hover:bg-surface-sand hover:text-secondary"
                >
                  {channel.id === 'facebook' && (
                    <span className="flex h-5 w-5 items-center justify-center text-xs font-bold leading-none text-secondary">
                      f
                    </span>
                  )}
                  {channel.id === 'whatsapp' && (
                    <MessageCircle size={16} strokeWidth={1.6} className="shrink-0 text-secondary" />
                  )}
                  {channel.id === 'email' && (
                    <Mail size={16} strokeWidth={1.6} className="shrink-0 text-secondary" />
                  )}
                  {channel.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
