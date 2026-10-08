'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState, useTransition } from 'react'
import { Globe } from 'lucide-react'

import { setLocale } from '@/i18n/actions'
import { dispatchSiteLocaleChange } from '@/i18n/localeEvents'
import { getMenuItemForLocale, type LanguageMenuItem, type Locale } from '@/i18n/config'
import {
  getHeaderDropdownItemClass,
  getHeaderDropdownPanelClass,
  getHeaderNavLinkClass,
} from '@/providers/HeroOverlay'
import { cn } from '@/utilities/ui'
import { invalidateTranslationsForLocale } from '@/utilities/translationStore'

const languageTriggerBase =
  'cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-tertiary/40'

type Props = {
  items: LanguageMenuItem[]
  currentLocale: Locale
  onDarkBackground?: boolean
}

export const LanguageSwitcher: React.FC<Props> = ({
  items,
  currentLocale,
  onDarkBackground = false,
}) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const active = getMenuItemForLocale(items, currentLocale)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  if (items.length === 0) {
    return null
  }

  const selectItem = (item: LanguageMenuItem) => {
    if (item.locale === currentLocale || isPending) {
      setOpen(false)
      return
    }

    setOpen(false)
    startTransition(async () => {
      dispatchSiteLocaleChange(item.locale)
      invalidateTranslationsForLocale(item.locale)
      await setLocale(item.locale)
      router.refresh()
    })
  }

  // Same type + vertical metrics as header nav links (centered with Home, etc.).
  const triggerClass = cn(
    getHeaderNavLinkClass(false, onDarkBackground),
    languageTriggerBase,
    'shrink-0',
    items.length < 2 && 'cursor-default',
    isPending && 'pointer-events-none opacity-60',
  )

  const triggerContent = (
    <>
      <Globe size={16} strokeWidth={1.75} aria-hidden className="shrink-0" />
      <span>{active.triggerCode}</span>
    </>
  )

  if (items.length === 1) {
    return (
      <div className={triggerClass} aria-label={`Language: ${active.label}`}>
        {triggerContent}
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative z-70">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Language: ${active.label}`}
        className={triggerClass}
        disabled={isPending}
        onClick={() => setOpen((value) => !value)}
      >
        {triggerContent}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select language"
          className={cn(
            'absolute left-0 top-full z-70 mt-1.5 min-w-[9.5rem] overflow-hidden py-1 max-xl:left-auto max-xl:right-0',
            getHeaderDropdownPanelClass(onDarkBackground),
            'animate-[lang-menu-in_0.18s_ease-out]',
          )}
        >
          {items.map((item) => {
            const isActive = item.locale === currentLocale

            return (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={cn(
                    'cursor-pointer',
                    getHeaderDropdownItemClass(isActive, onDarkBackground),
                  )}
                  onClick={() => selectItem(item)}
                >
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
