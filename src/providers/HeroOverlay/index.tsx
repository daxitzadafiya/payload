'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

type HeroOverlayContextValue = {
  isHeroOverlay: boolean
  registerHeroOverlay: () => () => void
}

const HeroOverlayContext = createContext<HeroOverlayContextValue>({
  isHeroOverlay: false,
  registerHeroOverlay: () => () => {},
})

export const HeroOverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [count, setCount] = useState(0)

  const registerHeroOverlay = useCallback(() => {
    setCount((current) => current + 1)
    return () => setCount((current) => Math.max(0, current - 1))
  }, [])

  return (
    <HeroOverlayContext.Provider value={{ isHeroOverlay: count > 0, registerHeroOverlay }}>
      {children}
    </HeroOverlayContext.Provider>
  )
}

export const useHeroOverlay = () => useContext(HeroOverlayContext)

export const useRegisterHeroOverlay = () => {
  const { registerHeroOverlay } = useHeroOverlay()

  useEffect(() => registerHeroOverlay(), [registerHeroOverlay])
}

const overlayNavShadow = 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]'

export const getHeaderNavLinkClass = (isActive: boolean, onDarkBackground: boolean) =>
  `inline-flex h-11 min-w-0 items-center gap-1.5 whitespace-nowrap font-label-nav text-[11px] leading-none uppercase tracking-[0.1em] transition-colors duration-300 xl:text-[12px] 2xl:text-[13px] 2xl:tracking-[0.12em] ${
    onDarkBackground
      ? isActive
        ? `border-b-2 border-secondary text-white ${overlayNavShadow}`
        : `border-b-2 border-transparent text-white ${overlayNavShadow} hover:text-white/85`
      : isActive
        ? 'text-tertiary'
        : 'text-on-surface hover:text-tertiary'
  }`

/** Shared panel styles for header language + nav dropdowns (Theme CSS vars). */
export const getHeaderDropdownPanelClass = (onDarkBackground: boolean) =>
  onDarkBackground
    ? 'rounded-lg border border-white/20 bg-inverse-surface/90 text-inverse-on-surface shadow-[0_16px_40px_-16px_rgba(0,0,0,0.65)] backdrop-blur-xl'
    : 'rounded-lg border border-outline-variant/35 bg-surface-container-lowest text-on-surface shadow-lg'

export const getHeaderDropdownItemClass = (isActive: boolean, onDarkBackground: boolean) =>
  `block w-full px-3.5 py-2.5 text-left font-label-nav text-[12px] uppercase tracking-[0.12em] transition-colors duration-200 ${
    onDarkBackground
      ? isActive
        ? 'border-l-2 border-secondary bg-white/12 text-white'
        : 'border-l-2 border-transparent text-white/85 hover:border-secondary hover:bg-white/10 hover:text-white'
      : isActive
        ? 'border-l-2 border-secondary bg-surface-sand text-on-surface'
        : 'border-l-2 border-transparent text-on-surface/85 hover:border-secondary hover:bg-surface-sand hover:text-on-surface'
  }`
