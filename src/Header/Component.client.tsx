'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { Menu, Star, X } from 'lucide-react'

import type { Header } from '@/payload-types'
import { getCMSLinkHref } from '@/components/Link'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import Logo from '@/components/Logo/Logo'
import type { LogoSources } from '@/components/Logo/getLogoSources'
import type { LanguageMenuItem, Locale } from '@/i18n/config'
import { SITE_LOCALE_CHANGE_EVENT } from '@/i18n/localeEvents'
import { usePropertyFavorites } from '@/providers/PropertyFavorites'
import { useHeroOverlay } from '@/providers/HeroOverlay'
import { cn } from '@/utilities/ui'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
  locale: Locale
  languageMenu: LanguageMenuItem[]
  logoSources: LogoSources
}

export const HeaderClient: React.FC<HeaderClientProps> = ({
  data,
  locale,
  languageMenu,
  logoSources,
}) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isHeroOverlay } = useHeroOverlay()
  const { count: favoritesCount } = usePropertyFavorites()
  const favoritesLink = data.favoritesLink
  const favoritesHref = getCMSLinkHref(favoritesLink ?? {}) ?? '/favorites'
  const favoritesAriaLabel =
    favoritesLink?.label ||
    (favoritesCount > 0 ? `Favorites, ${favoritesCount} saved` : 'Favorites')

  const isTransparent = isHeroOverlay && !isScrolled

  const { leftNavItems, rightNavItems } = useMemo(() => {
    const items = (data?.navItems || []).filter((item) => !item?.isDeleted)
    const mid = Math.ceil(items.length / 2)
    return {
      leftNavItems: items.slice(0, mid),
      rightNavItems: items.slice(mid),
    }
  }, [data?.navItems])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const onLocaleChange = () => setMenuOpen(false)
    window.addEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange)
    return () => window.removeEventListener(SITE_LOCALE_CHANGE_EVENT, onLocaleChange)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const iconBtnClass = cn(
    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm transition-colors',
    isTransparent
      ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]'
      : 'text-on-surface',
  )

  return (
    <nav
      className={cn(
        'fixed top-0 z-50 w-full overflow-visible transition-all duration-300',
        isTransparent
          ? 'border-b border-transparent bg-transparent pt-2 shadow-none backdrop-blur-none sm:pt-3 xl:pt-4'
          : 'border-b border-outline-variant/30 bg-surface/80 shadow-md backdrop-blur-md',
      )}
    >
      <div
        className={cn(
          'relative mx-auto grid h-14 w-full max-w-max-width grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 overflow-visible px-margin-mobile sm:h-16 sm:gap-x-4 md:px-margin-desktop xl:h-20',
        )}
      >
        {/* Left — language + left nav */}
        <div className="z-10 flex min-h-11 min-w-0 items-center justify-start gap-2 overflow-visible xl:gap-4">
          <div className="relative z-20 hidden shrink-0 items-center xl:flex">
            <LanguageSwitcher
              items={languageMenu}
              currentLocale={locale}
              onDarkBackground={isTransparent}
            />
          </div>
          <HeaderNav
            data={data}
            items={leftNavItems}
            desktopOnlyItems
            onDarkBackground={isTransparent}
            className="min-w-0 flex-1 justify-start"
          />
        </div>

        {/* Center logo — same grid row as menus for shared vertical center */}
        <Link
          className="relative z-20 flex h-full max-h-full shrink-0 items-center justify-center self-center px-2"
          href="/"
        >
          <Logo
            placement="header"
            sources={logoSources}
            onDarkBackground={isTransparent}
            className="max-w-[9.5rem] min-[380px]:max-w-[11rem] sm:max-w-[13rem] md:max-w-[15rem] xl:max-w-[18rem] 2xl:max-w-[20rem]"
          />
        </Link>

        {/* Right — desktop nav + utilities */}
        <div className="z-10 flex min-h-11 min-w-0 items-center justify-end gap-2 overflow-visible xl:gap-4">
          <HeaderNav
            data={data}
            items={rightNavItems}
            desktopOnlyItems
            onDarkBackground={isTransparent}
            className="min-w-0 flex-1 justify-end"
          />

          <div className="relative z-20 flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Link
              href={favoritesHref}
              {...(favoritesLink?.newTab
                ? { rel: 'noopener noreferrer', target: '_blank' }
                : {})}
              aria-label={
                favoritesCount > 0 && !favoritesLink?.label
                  ? `${favoritesAriaLabel}, ${favoritesCount} saved`
                  : favoritesAriaLabel
              }
              className={cn(iconBtnClass, 'relative hover:text-secondary')}
            >
              <Star className="h-5 w-5 sm:h-[22px] sm:w-[22px] xl:h-6 xl:w-6" />
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[9px] font-bold leading-none text-on-secondary xl:right-0 xl:top-0 xl:h-[18px] xl:min-w-[18px] xl:text-[10px]">
                {favoritesCount > 99 ? '99+' : favoritesCount || '0'}
              </span>
            </Link>

            <div className="flex h-11 items-center px-1.5 xl:hidden">
              <LanguageSwitcher
                items={languageMenu}
                currentLocale={locale}
                onDarkBackground={isTransparent}
              />
            </div>

            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className={cn(
                iconBtnClass,
                'border xl:hidden',
                isTransparent
                  ? 'border-white/40 hover:bg-white/10'
                  : 'border-outline-variant hover:bg-surface-container',
              )}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      <HeaderNav
        data={data}
        hideDesktop
        mobileOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onDarkBackground={isTransparent}
      />
    </nav>
  )
}
