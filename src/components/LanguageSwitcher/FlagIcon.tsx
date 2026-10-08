'use client'

import React, { useId } from 'react'

import type { FlagCountry } from '@/i18n/locales'
import { cn } from '@/utilities/ui'

export type { FlagCountry }

type Props = {
  country: FlagCountry
  className?: string
  title?: string
}

/** Circular country flag (SVG) — matches horizon estates gold/cream theme */
export const FlagIcon: React.FC<Props> = ({ country, className, title }) => {
  const clipId = useId()

  return (
    <span
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-full',
        'ring-1 ring-outline-variant/40',
        className,
      )}
      title={title}
      aria-hidden={title ? undefined : true}
    >
      {country === 'gb' && <FlagGB clipId={clipId} />}
      {country === 'us' && <FlagUS clipId={clipId} />}
      {country === 'de' && <FlagDE clipId={clipId} />}
      {country === 'fr' && <FlagFR clipId={clipId} />}
      {country === 'es' && <FlagES clipId={clipId} />}
      {country === 'gr' && <FlagGR clipId={clipId} />}
      {country === 'it' && <FlagIT clipId={clipId} />}
      {country === 'nl' && <FlagNL clipId={clipId} />}
    </span>
  )
}

function FlagClip({ clipId, children, label }: { clipId: string; children: React.ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 60 60" className="h-full w-full" role="img" aria-label={label}>
      <clipPath id={clipId}>
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>{children}</g>
    </svg>
  )
}

function FlagGB({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="United Kingdom">
      <rect width="60" height="60" fill="#012169" />
      <path d="M0 0L60 60M60 0L0 60" stroke="#fff" strokeWidth="10" />
      <path d="M0 0L60 60M60 0L0 60" stroke="#C8102E" strokeWidth="6" />
      <path d="M30 0V60M0 30H60" stroke="#fff" strokeWidth="16" />
      <path d="M30 0V60M0 30H60" stroke="#C8102E" strokeWidth="10" />
    </FlagClip>
  )
}

function FlagUS({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="United States">
      <rect width="60" height="60" fill="#B22234" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} y={i * 4.62} width="60" height="4.62" fill={i % 2 === 1 ? '#fff' : '#B22234'} />
      ))}
      <rect width="24" height="32" fill="#3C3B6E" />
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={4 + col * 5.5 + (row % 2) * 2.75}
            cy={4 + row * 5.5}
            r="1.1"
            fill="#fff"
          />
        )),
      )}
    </FlagClip>
  )
}

function FlagDE({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Germany">
      <rect width="60" height="20" y="0" fill="#000" />
      <rect width="60" height="20" y="20" fill="#DD0000" />
      <rect width="60" height="20" y="40" fill="#FFCE00" />
    </FlagClip>
  )
}

function FlagFR({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="France">
      <rect width="20" height="60" fill="#002395" />
      <rect x="20" width="20" height="60" fill="#fff" />
      <rect x="40" width="20" height="60" fill="#ED2939" />
    </FlagClip>
  )
}

function FlagES({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Spain">
      <rect width="60" height="60" fill="#AA151B" />
      <rect y="15" width="60" height="30" fill="#F1BF00" />
    </FlagClip>
  )
}

function FlagGR({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Greece">
      <rect width="60" height="60" fill="#0D5EAF" />
      <rect y="26" width="60" height="8" fill="#fff" />
      <rect x="26" width="8" height="60" fill="#fff" />
    </FlagClip>
  )
}

function FlagIT({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Italy">
      <rect width="20" height="60" fill="#009246" />
      <rect x="20" width="20" height="60" fill="#fff" />
      <rect x="40" width="20" height="60" fill="#CE2B37" />
    </FlagClip>
  )
}

function FlagNL({ clipId }: { clipId: string }) {
  return (
    <FlagClip clipId={clipId} label="Netherlands">
      <rect width="60" height="20" fill="#AE1C28" />
      <rect y="20" width="60" height="20" fill="#fff" />
      <rect y="40" width="60" height="20" fill="#21468B" />
    </FlagClip>
  )
}
