'use client'

import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import type { Header } from '@/payload-types'
import { CMSLink, getCMSLinkHref, isCMSLinkActive } from '@/components/Link'
import { SITE_LOCALE_CHANGE_EVENT } from '@/i18n/localeEvents'
import {
  getHeaderDropdownItemClass,
  getHeaderDropdownPanelClass,
  getHeaderNavLinkClass,
} from '@/providers/HeroOverlay'
import { cn } from '@/utilities/ui'

type NavItem = NonNullable<Header['navItems']>[number]
type NavLink = NavItem['link']
type SubLink = NonNullable<NavItem['subLinks']>[number]['link']

type Props = {
  link: NavLink
  subLinks: NonNullable<NavItem['subLinks']>
  variant?: 'desktop' | 'mobile'
  onNavigate?: () => void
  onDarkBackground?: boolean
}

const linkIsActive = (pathname: string, link: NavLink | SubLink) => {
  const href = getCMSLinkHref(link)
  return href ? isCMSLinkActive(pathname, href) : false
}

export const NavDropdown: React.FC<Props> = ({
  link,
  subLinks,
  variant = 'desktop',
  onNavigate,
  onDarkBackground = false,
}) => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const label = link.label || 'Menu'
  const isActive = subLinks.some(({ link: subLink }) => linkIsActive(pathname, subLink))

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const openMenu = () => {
    clearCloseTimer()
    setOpen(true)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setOpen(false), 120)
  }

  useEffect(() => {
    return () => clearCloseTimer()
  }, [])

  useEffect(() => {
    const onLocaleChange = () => {
      clearCloseTimer()
      setOpen(false)
    }
    window.addEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange)
    return () => window.removeEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange)
  }, [])

  useEffect(() => {
    if (variant !== 'desktop' || !open) return

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
  }, [open, variant])

  if (variant === 'mobile') {
    return (
      <div className="border-b border-outline-variant/20 last:border-b-0">
        <button
          type="button"
          aria-expanded={open}
          className={cn(
            'flex w-full items-center justify-between py-3',
            getHeaderNavLinkClass(isActive, false),
          )}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{label}</span>
          <ChevronDown
            size={18}
            className={cn('text-secondary transition-transform duration-200', open && 'rotate-180')}
          />
        </button>
        {open && (
          <div className="flex flex-col gap-1 pb-3 pl-4">
            {subLinks.map(({ link: subLink }, i) => (
              <div key={i} onClick={onNavigate} role="presentation">
                <CMSLink
                  {...subLink}
                  className={getHeaderDropdownItemClass(
                    linkIsActive(pathname, subLink),
                    false,
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className="relative min-w-0 max-w-full"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'w-full max-w-full min-w-0 cursor-pointer overflow-hidden',
          getHeaderNavLinkClass(isActive || open, onDarkBackground),
        )}
        onClick={() => (open ? scheduleClose() : openMenu())}
      >
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-60 min-w-[13.5rem] pt-2.5"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          <ul
            role="menu"
            aria-label={label}
            className={cn('overflow-hidden py-1.5', getHeaderDropdownPanelClass(onDarkBackground))}
          >
            {subLinks.map(({ link: subLink }, i) => (
              <li key={i} role="none" className="cursor-pointer">
                <CMSLink
                  {...subLink}
                  className={getHeaderDropdownItemClass(
                    linkIsActive(pathname, subLink),
                    onDarkBackground,
                  )}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
