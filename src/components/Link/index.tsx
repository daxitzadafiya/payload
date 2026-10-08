import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type { Page, Post } from '@/payload-types'

export type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | Post | string | number | null
  } | null
  size?: ButtonProps['size'] | null
  type?: 'custom' | 'reference' | null
  url?: string | null
}

export function getCMSLinkHref({
  type,
  reference,
  url,
}: Pick<CMSLinkType, 'type' | 'reference' | 'url'>): string | null {
  // `typeof null === 'object'` — guard null (e.g. trashed / missing populated docs)
  const value = reference?.value
  if (type === 'reference' && value && typeof value === 'object' && value.slug) {
    return reference.relationTo !== 'pages'
      ? `/${reference.relationTo}/${value.slug}`
      : `/${value.slug}`
  }

  return url ?? null
}

export function isCMSLinkActive(pathname: string, href: string): boolean {
  const normalize = (path: string) => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path)
  const path = normalize(pathname)
  const link = normalize(href)

  if (link === '/home' || link === '/') {
    return path === '/' || path === '/home'
  }

  if (path === link) {
    return true
  }

  return path.startsWith(`${link}/`)
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    newTab,
    reference,
    size: sizeFromProps,
    url,
  } = props

  const href = getCMSLinkHref({ type, reference, url })

  if (!href) return null

  const size = appearance === 'link' ? 'clear' : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    return (
      <Link className={cn(className)} href={href || url || ''} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link className={cn(className)} href={href || url || ''} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    </Button>
  )
}
