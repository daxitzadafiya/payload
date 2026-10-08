'use client'

import { usePathname } from 'next/navigation'
import React from 'react'
import type { Header as HeaderType } from '@/payload-types'
import { CMSLink, getCMSLinkHref, isCMSLinkActive } from '@/components/Link'
import { getHeaderNavLinkClass } from '@/providers/HeroOverlay'
import { cn } from '@/utilities/ui'
import { NavDropdown } from './NavDropdown'

type NavItem = NonNullable<HeaderType['navItems']>[number]

type Props = {
  data: HeaderType
  /** When set, only these items render in the desktop row (for split left/right nav). */
  items?: NavItem[]
  /** Hide the desktop row (mobile drawer still uses full `data.navItems`). */
  desktopOnlyItems?: boolean
  /** Skip rendering the desktop nav row entirely (mobile drawer only). */
  hideDesktop?: boolean
  mobileOpen?: boolean
  onClose?: () => void
  onDarkBackground?: boolean
  className?: string
}

const linkIsActive = (pathname: string, link: NavItem['link']) => {
  const href = getCMSLinkHref(link)
  return href ? isCMSLinkActive(pathname, href) : false
}

const hasSubLinks = (item: NavItem) => (item.subLinks?.length ?? 0) > 0

/** CSS-only overflow: shrink long labels with ellipsis instead of overlapping the logo / utilities. */
const desktopNavLinkOverflowClass =
  'block min-w-0 max-w-full shrink overflow-hidden text-ellipsis leading-[2.75rem]'

export const HeaderNav: React.FC<Props> = ({
  data,
  items,
  desktopOnlyItems = false,
  hideDesktop = false,
  mobileOpen,
  onClose,
  onDarkBackground = false,
  className,
}) => {
  const pathname = usePathname()
  const allNavItems = (data?.navItems || []).filter((item) => !item?.isDeleted)
  const desktopItems = items ?? allNavItems

  return (
    <>
      {!hideDesktop && (
        <div
          className={cn(
            'hidden min-w-0 max-w-full flex-nowrap items-center gap-2 xl:flex 2xl:gap-5',
            className,
          )}
        >
          {desktopItems.map((item, i) =>
            hasSubLinks(item) ? (
              <NavDropdown
                key={item.id ?? i}
                link={item.link}
                subLinks={item.subLinks!}
                onDarkBackground={onDarkBackground}
              />
            ) : (
              <CMSLink
                key={item.id ?? i}
                {...item.link}
                className={cn(
                  getHeaderNavLinkClass(
                    linkIsActive(pathname, item.link),
                    onDarkBackground,
                  ),
                  desktopNavLinkOverflowClass,
                )}
              />
            ),
          )}
        </div>
      )}

      {!desktopOnlyItems && mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className={cn(
              'fixed inset-0 z-40 bg-black/55 xl:hidden',
              onDarkBackground
                ? 'top-[calc(0.5rem+3.5rem)] sm:top-[calc(0.75rem+4rem)]'
                : 'top-14 sm:top-16',
            )}
            onClick={onClose}
          />
          <div
            className={cn(
              'fixed left-0 right-0 z-50 overflow-y-auto border-b border-outline-variant/30 bg-surface shadow-lg xl:hidden',
              onDarkBackground
                ? 'top-[calc(0.5rem+3.5rem)] max-h-[calc(100dvh-4rem)] sm:top-[calc(0.75rem+4rem)] sm:max-h-[calc(100dvh-4.75rem)]'
                : 'top-14 max-h-[calc(100dvh-3.5rem)] sm:top-16 sm:max-h-[calc(100dvh-4rem)]',
            )}
          >
            <nav className="flex flex-col gap-1 px-margin-mobile py-6">
              {allNavItems.map((item, i) =>
                hasSubLinks(item) ? (
                  <NavDropdown
                    key={item.id ?? i}
                    link={item.link}
                    subLinks={item.subLinks!}
                    variant="mobile"
                    onNavigate={onClose}
                  />
                ) : (
                  <div key={item.id ?? i} onClick={onClose} role="presentation">
                    <CMSLink
                      {...item.link}
                      className={`block py-3 ${getHeaderNavLinkClass(linkIsActive(pathname, item.link), false)}`}
                    />
                  </div>
                ),
              )}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
