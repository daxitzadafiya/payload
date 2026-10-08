'use client'

import React from 'react'

import { cn } from '@/utilities/ui'

type Variant = 'swirl' | 'rings' | 'grid'

type Props = {
  variant?: Variant
  className?: string
  /** Extra opacity multiplier via Tailwind opacity utilities preferred; this is fallback */
  tone?: 'soft' | 'whisper'
}

/**
 * Light gold line art used across Template Two surfaces.
 * Decorative only — keep pointer-events none and low contrast.
 */
export const DecorativeVectors: React.FC<Props> = ({
  variant = 'swirl',
  className,
  tone = 'soft',
}) => {
  const gridId = React.useId().replace(/:/g, '')
  const opacity = tone === 'whisper' ? 'opacity-[0.55]' : 'opacity-100'

  if (variant === 'rings') {
    return (
      <div
        className={cn(
          'pointer-events-none absolute text-secondary',
          opacity,
          className,
        )}
        aria-hidden
      >
        <div className="about-ring-breathe absolute inset-0 rounded-full border border-secondary/30" />
        <div className="about-ring-breathe about-ring-breathe-delay absolute inset-[12%] rounded-full border border-secondary/18" />
        <div className="absolute inset-[24%] rounded-full border border-secondary/10" />
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div
        className={cn('pointer-events-none absolute text-secondary', opacity, className)}
        aria-hidden
      >
        <svg className="h-full w-full opacity-[0.12]" viewBox="0 0 240 320" preserveAspectRatio="none">
          <defs>
            <pattern id={gridId} width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke="currentColor" strokeWidth="0.55" />
            </pattern>
          </defs>
          <rect width="240" height="320" fill={`url(#${gridId})`} />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={cn('pointer-events-none absolute text-secondary', opacity, className)}
      aria-hidden
    >
      <svg
        className="collage-lines-float h-full w-full overflow-visible"
        viewBox="0 0 800 760"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse
          cx="400"
          cy="375"
          rx="300"
          ry="205"
          transform="rotate(-14 400 375)"
          stroke="currentColor"
          strokeWidth="0.7"
          opacity="0.38"
        />
        <ellipse
          cx="415"
          cy="365"
          rx="265"
          ry="220"
          transform="rotate(20 415 365)"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.28"
        />
        <ellipse
          cx="375"
          cy="395"
          rx="225"
          ry="175"
          transform="rotate(-6 375 395)"
          stroke="currentColor"
          strokeWidth="0.55"
          opacity="0.22"
        />
        <path
          d="M145 195C235 78 445 48 565 128c95 64 138 205 72 310"
          stroke="currentColor"
          strokeWidth="0.65"
          opacity="0.32"
        />
        <path
          d="M115 505C195 635 415 700 575 615c105-55 145-185 82-278"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.26"
        />
      </svg>
    </div>
  )
}
