'use client'

import React from 'react'
import { useEffect, useState } from 'react'

import type { Logo as LogoGlobal } from '@/payload-types'
import { cn } from '@/utilities/ui'
import { getLogoSources, type LogoSources } from './getLogoSources'
import styles from './Logo.module.css'

type LogoPlacement = 'header' | 'footer'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
  /** Always show the light (white) logo variant, for use on dark backgrounds */
  onDarkBackground?: boolean
  sources?: LogoSources
  /** Where the logo is rendered — drives max width/height for any upload size */
  placement?: LogoPlacement
}

const placementClasses: Record<LogoPlacement, string> = {
  header:
    'max-w-[12.5rem] min-[380px]:max-w-[14rem] sm:max-w-[17rem] md:max-w-[20rem] lg:max-w-[22rem]',
  footer: 'max-w-[12.5rem] sm:max-w-[14.5rem] md:max-w-[17.5rem]',
}

export const Logo = (props: Props) => {
  const {
    loading: loadingFromProps,
    priority: priorityFromProps,
    className,
    onDarkBackground = false,
    sources: sourcesFromProps,
    placement = 'header',
  } = props

  const [dynamicSources, setDynamicSources] = useState<LogoSources | null>(null)

  useEffect(() => {
    if (sourcesFromProps) return

    let isCancelled = false

    const loadLogo = async () => {
      try {
        const response = await fetch('/api/globals/logo?depth=1')
        if (!response.ok) return

        const logoData = (await response.json()) as LogoGlobal
        if (!isCancelled) {
          setDynamicSources(getLogoSources(logoData))
        }
      } catch {
        // Keep fallback logo sources if request fails
      }
    }

    void loadLogo()

    return () => {
      isCancelled = true
    }
  }, [sourcesFromProps])

  const resolvedSources = sourcesFromProps ?? dynamicSources ?? getLogoSources()
  const { lightSrc, darkSrc, alt, width, height } = resolvedSources

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'
  const sizeClass = placement === 'footer' ? styles.footer : styles.header

  const logoProps = {
    alt,
    width,
    height,
    decoding: 'async' as const,
  }

  return (
    <span
      className={cn(
        'flex items-center shrink-0 overflow-hidden',
        placementClasses[placement],
        className,
      )}
    >
      {/* eslint-disable @next/next/no-img-element */}
      <img
        {...logoProps}
        className={cn(
          styles.logo,
          sizeClass,
          onDarkBackground ? styles.onDark : styles.light,
        )}
        fetchPriority={priority}
        loading={loading}
        src={lightSrc}
      />
      <img
        {...logoProps}
        className={cn(
          styles.logo,
          sizeClass,
          onDarkBackground ? styles.onDarkVisible : styles.dark,
        )}
        fetchPriority={priority}
        loading={loading}
        src={darkSrc}
      />
    </span>
  )
}

export default Logo
