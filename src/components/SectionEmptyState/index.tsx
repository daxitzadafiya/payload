'use client'

import React from 'react'
import { Building2, type LucideIcon } from 'lucide-react'
import { cn } from '@/utilities/ui'
import { useTranslation } from '@/utilities/translateClient'

type SectionEmptyStateProps = {
  eyebrow?: string
  title?: string
  description?: string
  icon?: LucideIcon
  className?: string
  /** Matches PropertiesBlock section background when set */
  tone?: 'surface' | 'muted'
  /** Optional CTA below the description (e.g. Save search). */
  action?: React.ReactNode
}

const GhostPropertyCards = () => (
  <div
    className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center gap-4 md:gap-6 px-6 opacity-[0.45]"
    aria-hidden
  >
    {[0, 1, 2].map((index) => (
      <div
        key={index}
        className={cn(
          'w-[28%] max-w-[200px] shrink-0 rounded-xl border border-outline-variant/40 bg-surface/60 overflow-hidden shadow-sm',
          index === 1 ? 'scale-100 -translate-y-1' : 'scale-[0.92] opacity-70',
          index === 0 && '-rotate-2',
          index === 2 && 'rotate-2',
        )}
      >
        <div className="aspect-[4/3] bg-gradient-to-b from-surface-container-high/80 to-surface-container-low/40" />
        <div className="space-y-2 p-3 md:p-4">
          <div className="h-2 w-2/3 rounded-full bg-outline-variant/30" />
          <div className="h-2.5 w-full rounded-full bg-outline-variant/25" />
          <div className="flex justify-between pt-1">
            <div className="h-2 w-1/3 rounded-full bg-outline-variant/20" />
            <div className="h-2 w-1/4 rounded-full bg-tertiary-fixed-dim/40" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const SectionEmptyState: React.FC<SectionEmptyStateProps> = ({
  eyebrow,
  title,
  description,
  icon: Icon = Building2,
  className = '',
  tone = 'muted',
  action,
}) => {
  const defaultEyebrow = useTranslation('emptyState.eyebrow', 'No results')
  const defaultTitle = useTranslation('emptyState.title', 'No items available')
  const defaultDescription = useTranslation(
    'emptyState.description',
    'Please check back later.',
  )

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-outline-variant/50',
        tone === 'surface'
          ? 'bg-surface shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]'
          : 'bg-surface-container-low/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,var(--color-tertiary-fixed-dim,#e6c364)_0%,transparent_55%)] opacity-20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-surface-container/40 to-transparent"
        aria-hidden
      />

      <GhostPropertyCards />

      <div className="relative z-10 flex flex-col items-center px-6 py-14 md:py-16 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant bg-surface/90 text-tertiary shadow-sm backdrop-blur-sm">
          <Icon size={26} strokeWidth={1.5} aria-hidden />
        </div>

        <span className="text-tertiary font-label-nav text-label-nav tracking-[0.2em] md:tracking-[0.3em] uppercase">
          {eyebrow ?? defaultEyebrow}
        </span>

        <h3 className="mt-3 font-headline-sm text-headline-sm text-primary max-w-lg">
          {title ?? defaultTitle}
        </h3>

        <p className="mt-3 max-w-md font-body-md text-body-md text-secondary leading-relaxed">
          {description ?? defaultDescription}
        </p>

        {action ? <div className="mt-6">{action}</div> : null}

        <div
          className="mt-8 h-px w-16 bg-gradient-to-r from-transparent via-tertiary-container/70 to-transparent"
          aria-hidden
        />
      </div>
    </div>
  )
}
