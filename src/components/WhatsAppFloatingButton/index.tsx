'use client'

import React from 'react'
import { FaWhatsapp } from 'react-icons/fa'

import type { PublicWhatsAppSettings } from '@/settings/integrations/shared'
import { useTranslation } from '@/utilities/translateClient'
import { cn } from '@/utilities/ui'

type Props = {
  settings: PublicWhatsAppSettings
}

export function WhatsAppFloatingButton({ settings }: Props) {
  const label = useTranslation('whatsapp.chatOnWhatsapp', 'Chat on WhatsApp')
  if (!settings.enabled || !settings.waMeUrl) return null

  const isLeft = settings.position === 'left'

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-60 bottom-25 md:bottom-25',
        'whatsapp-fab-enter',
        isLeft ? 'left-6 md:left-6' : 'right-6 md:right-6',
      )}
    >
      <span
        className="whatsapp-fab-ring pointer-events-none absolute inset-0 m-auto size-14 rounded-full"
        aria-hidden="true"
      />
      <span
        className="whatsapp-fab-ring whatsapp-fab-ring-delay pointer-events-none absolute inset-0 m-auto size-14 rounded-full"
        aria-hidden="true"
      />

      <a
        href={settings.waMeUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        aria-label={label}
        className={cn(
          'pointer-events-auto relative flex size-14 items-center justify-center rounded-full',
          'bg-tertiary text-white cursor-pointer',
          'shadow-[0_8px_24px_rgba(0,0,0,0.22)]',
          'transition-[transform,box-shadow,background-color] duration-200 ease-out',
          'hover:bg-tertiary-container hover:shadow-[0_12px_28px_rgba(0,0,0,0.28)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary',
          'active:scale-[0.97] active:translate-y-0',
        )}
      >
        <FaWhatsapp size={30} aria-hidden="true" />
      </a>
    </div>
  )
}
